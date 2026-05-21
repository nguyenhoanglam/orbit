'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { KanbanTask } from '@/components/KanbanBoard'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
  none: 'bg-transparent',
}

interface KanbanCardProps {
  task: KanbanTask
  onClick: () => void
  isDragOverlay?: boolean
}

export function KanbanCard({ task, onClick, isDragOverlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.column_id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-dashed border-border bg-transparent h-[72px] mx-3"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group mx-3 rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer',
        'hover:border-primary/40 hover:shadow-md transition-all select-none',
        isDragOverlay && 'shadow-xl rotate-1 opacity-95'
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
            PRIORITY_COLORS[task.priority] ?? 'bg-transparent'
          )}
        />
        <p className="flex-1 text-sm leading-snug line-clamp-2">{task.title}</p>
      </div>

      {(task.task_labels.length > 0 || task.task_assignees.length > 0 || task.due_date) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-3.5">
          {task.task_labels.map((tl) => (
            <Badge
              key={tl.label_id}
              variant="outline"
              className="h-4 px-1.5 py-0 text-[10px] font-medium"
              style={{ borderColor: tl.labels?.color, color: tl.labels?.color }}
            >
              {tl.labels?.name}
            </Badge>
          ))}

          {task.due_date && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {task.task_assignees.length > 0 && (
            <div className="ml-auto flex -space-x-1">
              {task.task_assignees.slice(0, 3).map((a) => (
                <Avatar key={a.user_id} className="h-4 w-4 border border-card">
                  <AvatarFallback className="text-[8px]">
                    {(a.profiles?.display_name ?? a.profiles?.email ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
