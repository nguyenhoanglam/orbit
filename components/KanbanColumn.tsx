'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Trash2, Check, X } from 'lucide-react'
import { KanbanCard } from '@/components/KanbanCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { deleteColumn, updateColumn, type ColState } from '@/lib/actions/columns'
import type { KanbanTask, KanbanColumn as KanbanColumnType } from '@/components/KanbanBoard'

interface KanbanColumnProps {
  column: KanbanColumnType
  boardId: string
  teamId: string
  teamSlug: string
  boardPath: string
  onTaskClick: (task: KanbanTask) => void
}

export function KanbanColumn({
  column,
  boardId,
  teamId,
  teamSlug,
  boardPath,
  onTaskClick,
}: KanbanColumnProps) {
  const [renaming, setRenaming] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column' },
  })

  const [renameState, renameAction, renamePending] = useActionState<ColState, FormData>(
    updateColumn,
    {}
  )

  useEffect(() => {
    if (!renameState.errors && !renameState.message && !renamePending) {
      setRenaming(false)
    }
  }, [renameState, renamePending])

  useEffect(() => {
    if (renaming) renameRef.current?.focus()
  }, [renaming])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/50',
        isDragging && 'opacity-50'
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag column"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {renaming ? (
          <form action={renameAction} className="flex flex-1 items-center gap-1">
            <input type="hidden" name="columnId" value={column.id} />
            <input type="hidden" name="boardPath" value={boardPath} />
            <Input
              ref={renameRef}
              name="name"
              defaultValue={column.name}
              className="h-6 flex-1 text-sm font-medium py-0"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setRenaming(false)
              }}
            />
            <button type="submit" disabled={renamePending} className="text-muted-foreground hover:text-foreground">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setRenaming(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <>
            <h3
              className="flex-1 text-sm font-medium leading-none cursor-pointer truncate"
              onClick={() => setRenaming(true)}
            >
              {column.name}
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {column.tasks.length}
            </span>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 text-muted-foreground hover:text-foreground outline-none">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <form action={deleteColumn}>
                <input type="hidden" name="columnId" value={column.id} />
                <input type="hidden" name="boardPath" value={boardPath} />
                <button type="submit" className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete column
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task list */}
      <div className="flex flex-1 flex-col gap-2 pb-2">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
