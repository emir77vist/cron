import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Phase = 'scatter' | 'converge' | 'hold' | 'disperse'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  seed: number
  tx: number
  ty: number
  tz: number
  size: number
  alpha: number
}

interface OpeningSceneProps {
  onComplete: () => void
}

/** public/logo.png — works with Vite base `/` and `/cron/`. */
function logoUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? `${base}logo.png` : `${base}/logo.png`
}

function fitLogo(nw: number, nh: number, vw: number, vh: number) {
  const maxW = Math.min(vw * 0.52, 520)
  const maxH = Math.min(vh * 0.3, 180)
  const s = Math.min(maxW / nw, maxH / nh)
  return { lw: nw * s, lh: nh * s }
}

/**
 * White particle field → converges on public/logo.png → hold → disperse.
 * Always paints (never blank). Skip with button / Esc.
 */
export function OpeningScene({ onComplete }: OpeningSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fading, setFading] = useState(false)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setFading(true)
    window.setTimeout(() => onComplete(), 400)
  }, [onComplete])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      finish()
      return
    }

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      finish()
      return
    }

    let alive = true
    let raf = 0
    let phase: Phase = 'scatter'
    let phaseStart = performance.now()
    let logo: HTMLImageElement | null = null
    let particles: Particle[] = []
    let w = 0
    let h = 0
    const mouse = { x: 0, y: 0, on: false }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, window.innerWidth)
      h = Math.max(1, window.innerHeight)
      canvas!.width = Math.floor(w * dpr)
      canvas!.height = Math.floor(h * dpr)
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function sampleFromLogo(count: number): { x: number; y: number }[] | null {
      if (!logo || logo.naturalWidth < 2) return null
      const { lw, lh } = fitLogo(logo.naturalWidth, logo.naturalHeight, w, h)
      const sw = Math.max(1, Math.round(lw))
      const sh = Math.max(1, Math.round(lh))
      try {
        const off = document.createElement('canvas')
        off.width = sw
        off.height = sh
        const o = off.getContext('2d', { willReadFrequently: true })
        if (!o) return null
        o.clearRect(0, 0, sw, sh)
        o.drawImage(logo, 0, 0, sw, sh)
        const { data } = o.getImageData(0, 0, sw, sh)
        const pts: { x: number; y: number }[] = []
        const step = Math.max(1, Math.floor(Math.min(sw, sh) / 100))
        const ox = w / 2 - lw / 2
        const oy = h / 2 - lh / 2
        for (let y = 0; y < sh; y += step) {
          for (let x = 0; x < sw; x += step) {
            if (data[(y * sw + x) * 4 + 3] > 35) {
              pts.push({
                x: ox + (x / sw) * lw,
                y: oy + (y / sh) * lh,
              })
            }
          }
        }
        if (pts.length < 20) return null
        const out: { x: number; y: number }[] = []
        for (let i = 0; i < count; i++) out.push(pts[i % pts.length])
        return out
      } catch {
        return null
      }
    }

    function sampleFallback(count: number): { x: number; y: number }[] {
      const off = document.createElement('canvas')
      off.width = 700
      off.height = 220
      const o = off.getContext('2d', { willReadFrequently: true })
      const pts: { x: number; y: number }[] = []
      if (o) {
        o.clearRect(0, 0, 700, 220)
        o.fillStyle = '#fff'
        o.font = '700 150px system-ui,sans-serif'
        o.textAlign = 'center'
        o.textBaseline = 'middle'
        o.fillText('Cron', 350, 110)
        const { data } = o.getImageData(0, 0, 700, 220)
        for (let y = 0; y < 220; y += 2) {
          for (let x = 0; x < 700; x += 2) {
            if (data[(y * 700 + x) * 4 + 3] > 100) pts.push({ x, y })
          }
        }
      }
      const sc = Math.min(w * 0.5, 500) / 700
      const out: { x: number; y: number }[] = []
      for (let i = 0; i < count; i++) {
        if (!pts.length) {
          out.push({ x: w / 2, y: h / 2 })
        } else {
          const p = pts[i % pts.length]
          out.push({
            x: w / 2 - 350 * sc + p.x * sc,
            y: h / 2 - 110 * sc + p.y * sc,
          })
        }
      }
      return out
    }

    function buildParticles() {
      const count = Math.min(1600, Math.max(480, Math.floor((w * h) / 700)))
      const targets = sampleFromLogo(count) ?? sampleFallback(count)
      particles = []
      for (let i = 0; i < count; i++) {
        const t = targets[i]
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: (Math.random() - 0.5) * 1.5,
          vx: 0,
          vy: 0,
          vz: 0,
          seed: Math.random() * Math.PI * 2,
          tx: t.x,
          ty: t.y,
          tz: (Math.random() - 0.5) * 0.25,
          size: 1.15 + Math.random() * 1.6,
          alpha: 0.7 + Math.random() * 0.3,
        })
      }
      phase = 'scatter'
      phaseStart = performance.now()
    }

    function retarget() {
      if (!particles.length) return
      const targets = sampleFromLogo(particles.length)
      if (!targets) return
      for (let i = 0; i < particles.length; i++) {
        particles[i].tx = targets[i].x
        particles[i].ty = targets[i].y
      }
    }

    function drawLogo(alpha: number) {
      if (!logo || alpha <= 0) return
      const { lw, lh } = fitLogo(logo.naturalWidth, logo.naturalHeight, w, h)
      ctx!.save()
      ctx!.globalAlpha = alpha
      // No plate / no fill behind — transparent PNG only
      ctx!.drawImage(logo, w / 2 - lw / 2, h / 2 - lh / 2, lw, lh)
      ctx!.restore()
    }

    function frame(now: number) {
      if (!alive) return
      const elapsed = (now - phaseStart) / 1000

      if (phase === 'scatter' && elapsed > 1.15) {
        phase = 'converge'
        phaseStart = now
      } else if (phase === 'converge' && elapsed > 2.55) {
        phase = 'hold'
        phaseStart = now
      } else if (phase === 'hold' && elapsed > 1.2) {
        phase = 'disperse'
        phaseStart = now
        for (const p of particles) {
          const dx = p.x - w / 2
          const dy = p.y - h / 2
          const len = Math.hypot(dx, dy) || 1
          const sp = 1.6 + Math.random() * 4
          p.vx = (dx / len) * sp + (Math.random() - 0.5)
          p.vy = (dy / len) * sp + (Math.random() - 0.5)
          p.vz = (Math.random() - 0.2) * 0.1
        }
      } else if (phase === 'disperse' && elapsed > 1.3) {
        finish()
        return
      }

      const t = (now - phaseStart) / 1000

      // Always paint background — never blank
      ctx!.fillStyle = '#0a0a0a'
      ctx!.fillRect(0, 0, w, h)

      if (phase === 'converge' && t > 0.9) {
        drawLogo(Math.min(0.45, (t - 0.9) * 0.6))
      } else if (phase === 'hold') {
        drawLogo(0.75)
      }

      for (const p of particles) {
        if (phase === 'scatter') {
          p.x += Math.sin(now * 0.001 + p.seed) * 0.3
          p.y += Math.cos(now * 0.0012 + p.seed) * 0.3
          p.z += Math.sin(now * 0.0008 + p.seed) * 0.004
        } else if (phase === 'converge') {
          const k = 0.06 + (1 - Math.exp(-t * 2)) * 0.1
          p.x += (p.tx - p.x) * k
          p.y += (p.ty - p.y) * k
          p.z += (p.tz - p.z) * 0.08
        } else if (phase === 'hold') {
          p.x += (p.tx - p.x) * 0.15 + Math.sin(now * 0.003 + p.seed) * 0.07
          p.y += (p.ty - p.y) * 0.15 + Math.cos(now * 0.0025 + p.seed) * 0.07
        } else {
          p.x += p.vx
          p.y += p.vy
          p.z += p.vz
          p.vx *= 1.012
          p.vy *= 1.012
          p.alpha *= 0.968
        }

        if (mouse.on && phase !== 'disperse') {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.hypot(dx, dy) || 1
          if (dist < 160) {
            const f = (1 - dist / 160) * 2.4
            p.x += (dx / dist) * f
            p.y += (dy / dist) * f
          } else if (dist < 300 && phase === 'scatter') {
            p.x -= (dx / dist) * 0.15
            p.y -= (dy / dist) * 0.15
          }
        }

        const scale = 700 / (700 + p.z * 180)
        const sx = w / 2 + (p.x - w / 2) * scale
        const sy = h / 2 + (p.y - h / 2) * scale
        const s = Math.max(0.6, p.size * scale)
        const a = Math.min(1, p.alpha * (0.85 + scale * 0.25))
        if (a < 0.04) continue
        ctx!.beginPath()
        ctx!.fillStyle = `rgba(255,255,255,${a})`
        ctx!.arc(sx, sy, s, 0, Math.PI * 2)
        ctx!.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    // Immediate black frame
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, w, h)

    // Start particles immediately (fallback targets), retarget when logo loads
    buildParticles()
    raf = requestAnimationFrame(frame)

    const img = new Image()
    img.onload = () => {
      if (!alive) return
      logo = img
      retarget()
    }
    img.onerror = () => {
      /* keep fallback targets */
    }
    img.src = logoUrl()
    if (img.complete && img.naturalWidth > 0) {
      logo = img
      retarget()
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.on = true
    }
    const onLeave = () => {
      mouse.on = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [finish])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] bg-[#0A0A0A] transition-opacity duration-500',
        fading ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Cron opening"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ background: '#0a0a0a' }}
      />
      {!fading && (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#2A2A2A] bg-[#0A0A0A]/95 px-5 py-2.5 text-xs tracking-wide text-[#888888] transition-colors hover:border-[#555555] hover:text-white"
        >
          Skip · Esc
        </button>
      )}
    </div>
  )
}

/** Intro shows unless reduced-motion or explicit ?intro=0 */
export function shouldShowIntro(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('intro') === '0') return false
    if (q.get('intro') === '1') return true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    return true
  } catch {
    return true
  }
}
