import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Bump when intro implementation changes so users see the new version once. */
const SESSION_KEY = 'cron.intro.seen.v3'

type Phase = 'scatter' | 'converge' | 'hold' | 'disperse' | 'done'

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

/**
 * White particle opening — cursor-reactive, converges on Cron logo, disperses.
 * Reliable init (no logo-wait deadlock). Skippable with clean shutdown.
 */
export function OpeningScene({ onComplete }: OpeningSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const genRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const phaseRef = useRef<Phase>('scatter')
  const phaseT0 = useRef(0)
  const logoImgRef = useRef<HTMLImageElement | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const finishedRef = useRef(false)
  const [fading, setFading] = useState(false)

  const shutdown = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    genRef.current += 1
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    particlesRef.current = []
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    setFading(true)
    window.setTimeout(() => onComplete(), 380)
  }, [onComplete])

  useEffect(() => {
    // Reduced motion: skip animation but still mark complete so app unlocks
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shutdown()
      return
    }

    const gen = ++genRef.current
    finishedRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    function resize() {
      if (!canvas || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, window.innerWidth)
      const h = Math.max(1, window.innerHeight)
      sizeRef.current = { w, h }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()

    function sampleTargets(count: number): { x: number; y: number }[] {
      const { w, h } = sizeRef.current
      const cx = w / 2
      const cy = h / 2
      const imgEl = logoImgRef.current

      if (imgEl && imgEl.naturalWidth > 0) {
        try {
          const maxW = Math.min(w * 0.46, 460)
          const scale = maxW / imgEl.naturalWidth
          const lw = Math.max(1, Math.floor(imgEl.naturalWidth * scale))
          const lh = Math.max(1, Math.floor(imgEl.naturalHeight * scale))
          const off = document.createElement('canvas')
          off.width = lw
          off.height = lh
          const octx = off.getContext('2d', { willReadFrequently: true })
          if (octx) {
            octx.clearRect(0, 0, lw, lh)
            octx.drawImage(imgEl, 0, 0, lw, lh)
            const { data } = octx.getImageData(0, 0, lw, lh)
            const pts: { x: number; y: number }[] = []
            const step = 2
            for (let y = 0; y < lh; y += step) {
              for (let x = 0; x < lw; x += step) {
                const i = (y * lw + x) * 4
                if (data[i + 3] > 60) {
                  pts.push({ x: cx - lw / 2 + x, y: cy - lh / 2 + y })
                }
              }
            }
            if (pts.length > 20) {
              const out: { x: number; y: number }[] = []
              for (let i = 0; i < count; i++) {
                out.push(pts[(i * 9973) % pts.length])
              }
              return out
            }
          }
        } catch {
          /* fall through */
        }
      }

      // Always-works text cloud
      const off = document.createElement('canvas')
      off.width = 700
      off.height = 220
      const octx = off.getContext('2d', { willReadFrequently: true })
      const pts: { x: number; y: number }[] = []
      if (octx) {
        octx.fillStyle = '#000'
        octx.fillRect(0, 0, off.width, off.height)
        octx.fillStyle = '#fff'
        octx.font = '700 150px system-ui, -apple-system, sans-serif'
        octx.textAlign = 'center'
        octx.textBaseline = 'middle'
        octx.fillText('Cron', 350, 115)
        const { data } = octx.getImageData(0, 0, off.width, off.height)
        for (let y = 0; y < off.height; y += 2) {
          for (let x = 0; x < off.width; x += 2) {
            if (data[(y * off.width + x) * 4] > 180) {
              pts.push({ x, y })
            }
          }
        }
      }

      const scale = Math.min(w * 0.52, 520) / off.width
      const out: { x: number; y: number }[] = []
      for (let i = 0; i < count; i++) {
        if (pts.length === 0) {
          out.push({ x: cx + (Math.random() - 0.5) * 200, y: cy })
        } else {
          const p = pts[i % pts.length]
          out.push({
            x: cx - (off.width * scale) / 2 + p.x * scale,
            y: cy - (off.height * scale) / 2 + p.y * scale,
          })
        }
      }
      return out
    }

    function createParticles() {
      const { w, h } = sizeRef.current
      const count = Math.min(1600, Math.max(400, Math.floor((w * h) / 700)))
      const targets = sampleTargets(count)
      const list: Particle[] = []
      for (let i = 0; i < count; i++) {
        const t = targets[i] ?? { x: w / 2, y: h / 2 }
        list.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: (Math.random() - 0.5) * 1.8,
          vx: 0,
          vy: 0,
          vz: 0,
          seed: Math.random() * Math.PI * 2,
          tx: t.x,
          ty: t.y,
          tz: (Math.random() - 0.5) * 0.35,
          size: 1.1 + Math.random() * 1.8,
          alpha: 0.55 + Math.random() * 0.45,
        })
      }
      particlesRef.current = list
      phaseRef.current = 'scatter'
      phaseT0.current = performance.now()
    }

    function retargetToLogo() {
      const list = particlesRef.current
      if (list.length === 0) return
      const targets = sampleTargets(list.length)
      for (let i = 0; i < list.length; i++) {
        const t = targets[i]
        if (t) {
          list[i].tx = t.x
          list[i].ty = t.y
        }
      }
    }

    function project(p: Particle, w: number, h: number) {
      const perspective = 700
      const scale = perspective / (perspective + p.z * 180)
      return {
        sx: w / 2 + (p.x - w / 2) * scale,
        sy: h / 2 + (p.y - h / 2) * scale,
        s: Math.max(0.6, p.size * scale),
        a: Math.min(1, p.alpha * (0.75 + scale * 0.35)),
      }
    }

    function loop() {
      if (genRef.current !== gen || finishedRef.current || !ctx) return

      const { w, h } = sizeRef.current
      const now = performance.now()
      if (phaseT0.current === 0) phaseT0.current = now
      const elapsed = (now - phaseT0.current) / 1000
      let phase = phaseRef.current

      if (phase === 'scatter' && elapsed > 1.25) {
        phase = 'converge'
        phaseRef.current = phase
        phaseT0.current = now
      } else if (phase === 'converge' && elapsed > 2.6) {
        phase = 'hold'
        phaseRef.current = phase
        phaseT0.current = now
      } else if (phase === 'hold' && elapsed > 1.2) {
        phase = 'disperse'
        phaseRef.current = phase
        phaseT0.current = now
        for (const p of particlesRef.current) {
          const dx = p.x - w / 2
          const dy = p.y - h / 2
          const len = Math.hypot(dx, dy) || 1
          const speed = 1.4 + Math.random() * 4
          p.vx = (dx / len) * speed + (Math.random() - 0.5) * 1.4
          p.vy = (dy / len) * speed + (Math.random() - 0.5) * 1.4
          p.vz = (Math.random() - 0.25) * 0.1
        }
      } else if (phase === 'disperse' && elapsed > 1.4) {
        phaseRef.current = 'done'
        shutdown()
        return
      }

      const tPhase = (now - phaseT0.current) / 1000
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const mouseOn = mouseRef.current.active

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, w, h)

      if (phase === 'converge' || phase === 'hold') {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 280)
        g.addColorStop(0, 'rgba(255,255,255,0.05)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      if (
        logoImgRef.current &&
        logoImgRef.current.naturalWidth > 0 &&
        (phase === 'hold' || (phase === 'converge' && tPhase > 1.0))
      ) {
        const imgEl = logoImgRef.current
        const maxW = Math.min(w * 0.46, 460)
        const scale = maxW / imgEl.naturalWidth
        const lw = imgEl.naturalWidth * scale
        const lh = imgEl.naturalHeight * scale
        ctx.save()
        ctx.globalAlpha =
          phase === 'hold' ? 0.18 : Math.min(0.18, (tPhase - 1.0) * 0.2)
        ctx.drawImage(imgEl, w / 2 - lw / 2, h / 2 - lh / 2, lw, lh)
        ctx.restore()
      }

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (phase === 'scatter') {
          p.x += Math.sin(now * 0.001 + p.seed) * 0.25
          p.y += Math.cos(now * 0.0011 + p.seed * 1.3) * 0.25
          p.z += Math.sin(now * 0.0009 + p.seed) * 0.004
        } else if (phase === 'converge') {
          const ease = 1 - Math.exp(-tPhase * 1.9)
          const k = 0.05 + ease * 0.1
          p.x += (p.tx - p.x) * k
          p.y += (p.ty - p.y) * k
          p.z += (p.tz - p.z) * 0.07
        } else if (phase === 'hold') {
          p.x += (p.tx - p.x) * 0.14 + Math.sin(now * 0.003 + p.seed) * 0.1
          p.y += (p.ty - p.y) * 0.14 + Math.cos(now * 0.0026 + p.seed) * 0.1
        } else if (phase === 'disperse') {
          p.x += p.vx
          p.y += p.vy
          p.z += p.vz
          p.vx *= 1.012
          p.vy *= 1.012
          p.alpha *= 0.972
        }

        if (mouseOn && phase !== 'disperse' && phase !== 'done') {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy) || 1
          if (dist < 180) {
            const force = (1 - dist / 180) * 2.6
            p.x += (dx / dist) * force
            p.y += (dy / dist) * force
          } else if (dist < 340 && phase === 'scatter') {
            p.x -= (dx / dist) * 0.18
            p.y -= (dy / dist) * 0.18
          }
        }

        const pr = project(p, w, h)
        if (pr.a < 0.03) continue
        ctx.beginPath()
        ctx.fillStyle = `rgba(255,255,255,${pr.a})`
        ctx.arc(pr.sx, pr.sy, pr.s, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    function onMove(e: PointerEvent) {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }
    function onLeave() {
      mouseRef.current.active = false
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        shutdown()
      }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)

    createParticles()
    rafRef.current = requestAnimationFrame(loop)

    // Logo with correct base path for GitHub Pages (/cron/)
    const logoUrl = new URL(
      'logo-large.png',
      window.location.origin + import.meta.env.BASE_URL,
    ).href
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (genRef.current !== gen) return
      logoImgRef.current = img
      retargetToLogo()
    }
    img.src = logoUrl
    if (img.complete && img.naturalWidth > 0) {
      logoImgRef.current = img
      retargetToLogo()
    }

    return () => {
      genRef.current += 1
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      particlesRef.current = []
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [shutdown])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] bg-[#0A0A0A] transition-opacity duration-500 ease-out',
        fading ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      role="dialog"
      aria-label="Cron opening"
      aria-modal="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ background: '#0a0a0a' }}
      />

      {!fading && (
        <button
          type="button"
          onClick={shutdown}
          className={cn(
            'absolute bottom-8 left-1/2 z-10 -translate-x-1/2',
            'rounded-full border border-[#2A2A2A] bg-[#0A0A0A]/90 px-5 py-2.5',
            'text-xs tracking-wide text-[#888888] transition-colors',
            'hover:border-[#555555] hover:text-white',
          )}
        >
          Skip · Esc
        </button>
      )}
    </div>
  )
}

/**
 * Show intro unless:
 * - already seen this session (after complete/skip), OR
 * - user prefers reduced motion, OR
 * - force with ?intro=1 / ?intro=0
 */
export function shouldShowIntro(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('intro') === '1') return true
    if (params.get('intro') === '0') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    return sessionStorage.getItem(SESSION_KEY) !== '1'
  } catch {
    return true
  }
}
