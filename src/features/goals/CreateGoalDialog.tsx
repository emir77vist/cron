import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createGoal,
  createTask,
  listParentOptions,
} from '@/lib/data/goals'
import { HORIZON_LABELS, HORIZON_ORDER } from '@/lib/goals/horizons'
import { useAppStore } from '@/stores/app-store'
import type { GoalHorizon } from '@/types'

type Mode = 'goal' | 'task'

interface CreateGoalDialogProps {
  open: boolean
  mode: Mode
  defaultHorizon?: GoalHorizon
  defaultParentId?: string | null
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateGoalDialog({
  open,
  mode,
  defaultHorizon = 'monthly',
  defaultParentId = null,
  onOpenChange,
  onCreated,
}: CreateGoalDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [horizon, setHorizon] = useState<GoalHorizon>(defaultHorizon)
  const [parentId, setParentId] = useState<string>(
    defaultParentId ?? '__none__',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setHorizon(defaultHorizon)
      setParentId(defaultParentId ?? '__none__')
      setError(null)
    }
  }, [open, defaultHorizon, defaultParentId, mode])

  const goalsMap = useAppStore((s) => s.goals)
  const parentOptions = useMemo(() => {
    if (mode === 'task') return listParentOptions()
    return listParentOptions(horizon)
  }, [mode, horizon, open, goalsMap])

  // Reset parent if no longer valid when horizon changes
  useEffect(() => {
    if (mode !== 'goal') return
    if (parentId === '__none__') return
    if (!parentOptions.some((p) => p.id === parentId)) {
      setParentId('__none__')
    }
  }, [horizon, parentOptions, parentId, mode])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (mode === 'task') {
      const task = createTask({
        title,
        goalId: parentId === '__none__' ? null : parentId,
      })
      if (!task) {
        setError('Could not create task.')
        return
      }
    } else {
      const goal = createGoal({
        title,
        description,
        horizon,
        parentId: parentId === '__none__' ? null : parentId,
      })
      if (!goal) {
        setError(
          'Could not create goal. Check parent horizon (parent must be coarser).',
        )
        return
      }
    }

    onCreated()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#2A2A2A] bg-[#141414] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === 'goal' ? 'New goal' : 'New task'}
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            {mode === 'goal'
              ? 'Link to a coarser parent for cascade progress.'
              : 'Optionally hang this task under a goal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="g-title" className="text-xs text-[#888888]">
              Title
            </Label>
            <Input
              id="g-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'goal' ? 'Ship career OS v1' : 'Update resume'}
              className="border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
              autoFocus
            />
          </div>

          {mode === 'goal' && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="g-horizon" className="text-xs text-[#888888]">
                  Horizon
                </Label>
                <Select
                  value={horizon}
                  onValueChange={(v) => setHorizon(v as GoalHorizon)}
                >
                  <SelectTrigger
                    id="g-horizon"
                    className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                    {HORIZON_ORDER.map((h) => (
                      <SelectItem key={h} value={h}>
                        {HORIZON_LABELS[h]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="g-desc" className="text-xs text-[#888888]">
                  Notes
                </Label>
                <Textarea
                  id="g-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional context"
                  className="resize-none border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
                />
              </div>
            </>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="g-parent" className="text-xs text-[#888888]">
              Link to parent
            </Label>
            <Select value={parentId} onValueChange={(v) => setParentId(v ?? '__none__')}>
              <SelectTrigger
                id="g-parent"
                className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
              >
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                <SelectItem value="__none__">No parent</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {HORIZON_LABELS[p.horizon]} · {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === 'goal' && parentOptions.length === 0 && (
              <p className="text-[11px] text-[#555555]">
                No coarser goals yet for this horizon.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-[#888888]" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
