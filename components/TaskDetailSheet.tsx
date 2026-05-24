'use client'

import { useState, useActionState, useEffect, startTransition, useCallback } from 'react'
import { X, Trash2, Flag, Calendar, User, Tag, Sparkles, Wand2, Loader2 } from 'lucide-react'
import { useCompletion } from '@ai-sdk/react'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { updateTask, deleteTask, addAssignee, removeAssignee, type TaskState } from '@/lib/actions/tasks'
import { addTaskLabel, removeTaskLabel } from '@/lib/actions/labels'
import type { KanbanTask, KanbanMember, KanbanLabel } from '@/components/KanbanBoard'

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'low', label: 'Low', color: 'text-blue-400' },
  { value: 'none', label: 'None', color: 'text-muted-foreground' },
] as const

interface TaskDetailSheetProps {
  task: KanbanTask
  members: KanbanMember[]
  teamLabels: KanbanLabel[]
  boardPath: string
  teamId: string
  aiEnabled?: boolean
  onClose: () => void
  onUpdate: (task: KanbanTask) => void
  onDelete: (taskId: string) => void
}

export function TaskDetailSheet({
  task,
  members,
  teamLabels,
  boardPath,
  teamId,
  aiEnabled = false,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailSheetProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [descValue, setDescValue] = useState(task.description ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [breakdownTasks, setBreakdownTasks] = useState<{ title: string; description?: string }[]>([])
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const { complete: generateDesc, isLoading: generatingDesc } = useCompletion({
    api: '/api/ai/generate-description',
    body: { teamId },
    streamProtocol: 'text',
    onFinish: (_prompt, completion) => {
      setDescValue(completion)
      setEditingDesc(true)
    },
  })

  const handleGenerateDesc = useCallback(() => {
    generateDesc(task.title)
  }, [generateDesc, task.title])

  const handleBreakdown = useCallback(async () => {
    setLoadingBreakdown(true)
    setBreakdownTasks([])
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description, teamId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { subtasks: { title: string; description?: string }[] }
      setBreakdownTasks(data.subtasks ?? [])
    } catch {
      // silently fail
    } finally {
      setLoadingBreakdown(false)
    }
  }, [task.title, task.description, teamId])

  const [updateState, updateAction, updatePending] = useActionState<TaskState, FormData>(
    updateTask,
    {}
  )

  // Sync task changes from parent
  useEffect(() => {
    setTitleValue(task.title)
    setDescValue(task.description ?? '')
  }, [task.id, task.title, task.description])

  const submitTitleUpdate = () => {
    if (titleValue.trim() === task.title) {
      setEditingTitle(false)
      return
    }
    const fd = new FormData()
    fd.set('taskId', task.id)
    fd.set('title', titleValue)
    fd.set('boardPath', boardPath)
    startTransition(() => {
      updateAction(fd)
      onUpdate({ ...task, title: titleValue.trim() })
    })
    setEditingTitle(false)
  }

  const submitDescUpdate = () => {
    const fd = new FormData()
    fd.set('taskId', task.id)
    fd.set('description', descValue)
    fd.set('boardPath', boardPath)
    startTransition(() => {
      updateAction(fd)
      onUpdate({ ...task, description: descValue || null })
    })
    setEditingDesc(false)
  }

  const handlePriorityChange = (priority: KanbanTask['priority']) => {
    const fd = new FormData()
    fd.set('taskId', task.id)
    fd.set('priority', priority)
    fd.set('boardPath', boardPath)
    startTransition(() => {
      updateAction(fd)
      onUpdate({ ...task, priority })
    })
  }

  const handleDueDateChange = (value: string) => {
    const fd = new FormData()
    fd.set('taskId', task.id)
    fd.set('due_date', value)
    fd.set('boardPath', boardPath)
    startTransition(() => {
      updateAction(fd)
      onUpdate({ ...task, due_date: value || null })
    })
  }

  const handleAssigneeToggle = async (member: KanbanMember) => {
    const isAssigned = task.task_assignees.some((a) => a.user_id === member.user_id)
    if (isAssigned) {
      await removeAssignee(task.id, member.user_id, boardPath)
      onUpdate({
        ...task,
        task_assignees: task.task_assignees.filter((a) => a.user_id !== member.user_id),
      })
    } else {
      await addAssignee(task.id, member.user_id, boardPath)
      onUpdate({
        ...task,
        task_assignees: [
          ...task.task_assignees,
          { user_id: member.user_id, profiles: member.profiles },
        ],
      })
    }
  }

  const handleLabelToggle = async (label: KanbanLabel) => {
    const hasLabel = task.task_labels.some((tl) => tl.label_id === label.id)
    if (hasLabel) {
      await removeTaskLabel(task.id, label.id, boardPath)
      onUpdate({
        ...task,
        task_labels: task.task_labels.filter((tl) => tl.label_id !== label.id),
      })
    } else {
      await addTaskLabel(task.id, label.id, boardPath)
      onUpdate({
        ...task,
        task_labels: [...task.task_labels, { label_id: label.id, labels: label }],
      })
    }
  }

  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === task.priority)

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="flex w-full max-w-lg flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="flex-row items-start justify-between border-b border-border pb-3">
          <div className="flex-1 pr-4">
            {editingTitle ? (
              <Input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="text-base font-semibold"
                onBlur={submitTitleUpdate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitTitleUpdate()
                  if (e.key === 'Escape') {
                    setTitleValue(task.title)
                    setEditingTitle(false)
                  }
                }}
              />
            ) : (
              <h2
                className="cursor-pointer text-base font-semibold leading-snug hover:text-primary"
                onClick={() => setEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" />
                }
              >
                <Trash2 className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The task and all its data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="boardPath" value={boardPath} />
                    <AlertDialogAction type="submit" onClick={() => onDelete(task.id)}>
                      Delete
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {/* Properties row */}
          <div className="flex flex-wrap gap-3">
            {/* Priority */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs',
                  'hover:border-primary/40 transition-colors',
                  currentPriority?.color
                )}>
                  <Flag className="h-3.5 w-3.5" />
                  {currentPriority?.label ?? 'Priority'}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <DropdownMenuItem
                    key={p.value}
                    onClick={() => handlePriorityChange(p.value)}
                    className={cn('gap-2', p.color)}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {p.label}
                    {task.priority === p.value && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Due date */}
            <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                className="bg-transparent text-xs outline-none"
                value={task.due_date ?? ''}
                onChange={(e) => handleDueDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Assignees
            </div>
            <div className="flex flex-wrap gap-1.5">
              {task.task_assignees.map((a) => (
                <button
                  key={a.user_id}
                  onClick={() => handleAssigneeToggle(members.find((m) => m.user_id === a.user_id)!)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs hover:border-destructive hover:text-destructive transition-colors"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {(a.profiles?.display_name ?? a.profiles?.email ?? '?')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {a.profiles?.display_name ?? a.profiles?.email}
                  <X className="h-2.5 w-2.5" />
                </button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    + Assign
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {members.map((m) => {
                    const assigned = task.task_assignees.some((a) => a.user_id === m.user_id)
                    return (
                      <DropdownMenuItem
                        key={m.user_id}
                        onClick={() => handleAssigneeToggle(m)}
                        className="gap-2"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {(m.profiles?.display_name ?? m.profiles?.email ?? '?')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">
                          {m.profiles?.display_name ?? m.profiles?.email}
                        </span>
                        {assigned && <span className="text-xs">✓</span>}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Labels */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Labels
            </div>
            <div className="flex flex-wrap gap-1.5">
              {task.task_labels.map((tl) =>
                tl.labels ? (
                  <button
                    key={tl.label_id}
                    onClick={() => tl.labels && handleLabelToggle(tl.labels)}
                    className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:opacity-70 transition-opacity"
                    style={{ borderColor: tl.labels.color, color: tl.labels.color }}
                  >
                    {tl.labels.name}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ) : null
              )}
              {teamLabels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      + Label
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {teamLabels.map((label) => {
                      const active = task.task_labels.some((tl) => tl.label_id === label.id)
                      return (
                        <DropdownMenuItem
                          key={label.id}
                          onClick={() => handleLabelToggle(label)}
                          className="gap-2"
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1">{label.name}</span>
                          {active && <span className="text-xs">✓</span>}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              {aiEnabled && !editingDesc && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs text-purple-500 hover:text-purple-600"
                  onClick={handleGenerateDesc}
                  disabled={generatingDesc}
                >
                  {generatingDesc ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI write
                </Button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[120px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDescValue(task.description ?? '')
                      setEditingDesc(false)
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={submitDescUpdate} disabled={updatePending}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setDescValue(task.description ?? '')
                      setEditingDesc(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer rounded-md p-2 text-sm hover:bg-muted/60 transition-colors min-h-[60px]"
                onClick={() => setEditingDesc(true)}
              >
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-muted-foreground">Add a description...</p>
                )}
              </div>
            )}
          </div>

          {/* AI Task Breakdown */}
          {aiEnabled && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">AI Breakdown</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs text-purple-500 hover:text-purple-600"
                  onClick={handleBreakdown}
                  disabled={loadingBreakdown}
                >
                  {loadingBreakdown ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Break into subtasks
                </Button>
              </div>
              {breakdownTasks.length > 0 && (
                <ul className="space-y-1.5 rounded-md border border-border p-2">
                  {breakdownTasks.map((t, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{t.title}</span>
                      {t.description && (
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            Created {new Date(task.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
