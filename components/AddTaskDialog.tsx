'use client'

import { useRef, useEffect, useState, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { createTask, type TaskState } from '@/lib/actions/tasks'
import type { KanbanColumn } from '@/components/KanbanBoard'

const INITIAL_STATE: TaskState = {}

interface AddTaskDialogProps {
  columns: KanbanColumn[]
  boardId: string
  teamId: string
  boardPath: string
  defaultColumnId?: string
}

export function AddTaskDialog({
  columns,
  boardId,
  teamId,
  boardPath,
  defaultColumnId,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? '')
  const titleRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [state, action, pending] = useActionState<TaskState, FormData>(createTask, INITIAL_STATE)

  // Only close after a successful submission (state changed from initial and has no errors)
  const prevStateRef = useRef<TaskState>(INITIAL_STATE)
  useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state
      if (!state.errors && !state.message) {
        setOpen(false)
      }
    }
  }, [state])

  useEffect(() => {
    if (open) {
      setColumnId(defaultColumnId ?? columns[0]?.id ?? '')
      formRef.current?.reset()
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open, defaultColumnId, columns])

  if (columns.length === 0) return null

  const selectedColumnName = columns.find((c) => c.id === columnId)?.name ?? 'Select column'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={action} className="flex flex-col gap-4 pt-1">
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="boardPath" value={boardPath} />
          <input type="hidden" name="columnId" value={columnId} />

          <div className="flex flex-col gap-1.5">
            <Input
              ref={titleRef}
              name="title"
              placeholder="Task title..."
              autoComplete="off"
            />
            {state.errors?.title && (
              <p className="text-xs text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <Select value={columnId} onValueChange={(v) => v && setColumnId(v)}>
            <SelectTrigger>
              <span>{selectedColumnName}</span>
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {state.message && (
            <p className="text-xs text-destructive">{state.message}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              Add task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
