'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus, Check, X } from 'lucide-react'
import { KanbanColumn } from '@/components/KanbanColumn'
import { KanbanCard } from '@/components/KanbanCard'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { reorderColumns } from '@/lib/actions/columns'
import { moveTask, reorderTasksInColumn } from '@/lib/actions/tasks'
import { createColumn, type ColState } from '@/lib/actions/columns'

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export interface KanbanMember {
  user_id: string
  role: string
  profiles: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

export interface KanbanTask {
  id: string
  column_id: string
  board_id: string
  team_id: string
  title: string
  description: string | null
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  due_date: string | null
  position: number
  created_by: string
  created_at: string
  task_assignees: Array<{
    user_id: string
    profiles: { display_name: string | null; email: string; avatar_url: string | null } | null
  }>
  task_labels: Array<{
    label_id: string
    labels: KanbanLabel | null
  }>
}

export interface KanbanColumn {
  id: string
  board_id: string
  name: string
  position: number
  tasks: KanbanTask[]
}

export interface KanbanBoardProps {
  initialColumns: KanbanColumn[]
  boardId: string
  teamId: string
  teamSlug: string
  boardPath: string
  members: KanbanMember[]
  teamLabels: KanbanLabel[]
  aiEnabled?: boolean
}

export function KanbanBoard({
  initialColumns,
  boardId,
  teamId,
  teamSlug,
  boardPath,
  members,
  teamLabels,
  aiEnabled = false,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeItem, setActiveItem] = useState<
    { type: 'column'; data: KanbanColumn } | { type: 'task'; data: KanbanTask } | null
  >(null)
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const addColRef = useRef<HTMLInputElement>(null)

  const [addColState, addColAction, addColPending] = useActionState<ColState, FormData>(
    createColumn,
    {}
  )

  useEffect(() => {
    if (!addColState.errors && !addColState.message && !addColPending) {
      setAddingColumn(false)
    }
  }, [addColState, addColPending])

  useEffect(() => {
    if (addingColumn) addColRef.current?.focus()
  }, [addingColumn])

  // Sync with server updates
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const findColumn = (id: string) => columns.find((c) => c.id === id)
  const findTask = (id: string) => {
    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === id)
      if (task) return { task, column: col }
    }
    return null
  }

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    const type = active.data.current?.type as 'column' | 'task'
    if (type === 'column') {
      const col = findColumn(active.id as string)
      if (col) setActiveItem({ type: 'column', data: col })
    } else if (type === 'task') {
      const found = findTask(active.id as string)
      if (found) setActiveItem({ type: 'task', data: found.task })
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    if (activeType !== 'task') return

    const activeId = active.id as string
    const overId = over.id as string

    const overType = over.data.current?.type
    const overColumnId: string = overType === 'column'
      ? overId
      : (over.data.current?.columnId as string)

    if (!overColumnId) return

    const activeColumnId = active.data.current?.columnId as string
    if (activeColumnId === overColumnId) return

    setColumns((cols) => {
      const activeCol = cols.find((c) => c.id === activeColumnId)
      const task = activeCol?.tasks.find((t) => t.id === activeId)
      if (!task) return cols

      return cols.map((col) => {
        if (col.id === activeColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) }
        }
        if (col.id === overColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, { ...task, column_id: overColumnId }],
          }
        }
        return col
      })
    })

    // Update active item's columnId for subsequent onDragOver calls
    if (active.data.current) active.data.current.columnId = overColumnId
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const activeType = active.data.current?.type

    if (activeType === 'column') {
      const activeId = active.id as string
      const overId = over.id as string
      if (activeId === overId) return

      setColumns((cols) => {
        const oldIndex = cols.findIndex((c) => c.id === activeId)
        const newIndex = cols.findIndex((c) => c.id === overId)
        const reordered = arrayMove(cols, oldIndex, newIndex)
        // Call server action
        reorderColumns(
          boardId,
          reordered.map((c) => c.id),
          boardPath
        )
        return reordered
      })
    } else if (activeType === 'task') {
      const activeId = active.id as string
      const overId = over.id as string

      const activeColumnId = active.data.current?.columnId as string
      const overType = over.data.current?.type
      const overColumnId: string = overType === 'column'
        ? overId
        : (over.data.current?.columnId as string)

      if (!activeColumnId || !overColumnId) return

      setColumns((cols) => {
        const activeColIndex = cols.findIndex((c) => c.id === activeColumnId)
        const overColIndex = cols.findIndex((c) => c.id === overColumnId)

        if (activeColumnId === overColumnId) {
          // Reorder within same column
          const col = cols[activeColIndex]
          const oldIndex = col.tasks.findIndex((t) => t.id === activeId)
          const newIndex = overType === 'column'
            ? col.tasks.length - 1
            : col.tasks.findIndex((t) => t.id === overId)
          if (oldIndex === newIndex) return cols

          const reordered = arrayMove(col.tasks, oldIndex, newIndex)
          reorderTasksInColumn(
            activeColumnId,
            reordered.map((t) => t.id),
            boardPath
          )

          const newCols = [...cols]
          newCols[activeColIndex] = { ...col, tasks: reordered }
          return newCols
        } else {
          // Move to different column (state already updated in onDragOver)
          const targetCol = cols[overColIndex]
          const taskIndex = targetCol.tasks.findIndex((t) => t.id === activeId)
          moveTask(activeId, overColumnId, taskIndex, boardPath)
          return cols
        }
      })
    }
  }

  const handleTaskUpdate = (updated: KanbanTask) => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
    )
    setSelectedTask(updated)
  }

  const handleTaskDelete = (taskId: string) => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    )
    setSelectedTask(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full items-start gap-3 overflow-x-auto p-4">
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                boardId={boardId}
                teamId={teamId}
                teamSlug={teamSlug}
                boardPath={boardPath}
                onTaskClick={setSelectedTask}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          {addingColumn ? (
            <form action={addColAction} className="w-72 shrink-0">
              <input type="hidden" name="boardId" value={boardId} />
              <input type="hidden" name="boardPath" value={boardPath} />
              <input type="hidden" name="teamSlug" value={teamSlug} />
              <div className="flex items-center gap-1.5 rounded-xl border border-primary bg-muted/50 px-3 py-2.5">
                <Input
                  ref={addColRef}
                  name="name"
                  placeholder="Column name..."
                  className="h-7 flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setAddingColumn(false)
                  }}
                />
                <button
                  type="submit"
                  disabled={addColPending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAddingColumn(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setAddingColumn(true)}
            >
              <Plus className="h-4 w-4" />
              Add column
            </Button>
          )}
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeItem?.type === 'column' && (
                <div className="w-72 rounded-xl border border-border bg-muted/50 opacity-90 shadow-2xl">
                  <div className="flex items-center gap-1 px-3 py-2.5">
                    <span className="text-sm font-medium">{activeItem.data.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {activeItem.data.tasks.length}
                    </span>
                  </div>
                </div>
              )}
              {activeItem?.type === 'task' && (
                <KanbanCard task={activeItem.data} onClick={() => {}} isDragOverlay />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          teamLabels={teamLabels}
          boardPath={boardPath}
          teamId={teamId}
          aiEnabled={aiEnabled}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </>
  )
}
