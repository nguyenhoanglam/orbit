'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBoard, type BoardState } from '@/lib/actions/boards'
import { useState, useEffect } from 'react'

interface CreateBoardDialogProps {
  workspaceId: string
  teamSlug: string
}

export function CreateBoardDialog({ workspaceId, teamSlug }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<BoardState, FormData>(createBoard, {})

  useEffect(() => {
    if (!state.errors && !state.message && !pending) {
      setOpen(false)
    }
  }, [state, pending])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />} className="gap-1.5">
        <Plus className="h-4 w-4" />
        New board
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="teamSlug" value={teamSlug} />
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Engineering" autoFocus required />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="description" name="description" placeholder="What is this board for?" rows={2} />
          </div>
          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Creating...' : 'Create board'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
