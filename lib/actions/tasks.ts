'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TaskState {
  errors?: { title?: string[] }
  message?: string
  taskId?: string
}

const CreateTaskSchema = z.object({
  columnId: z.string().uuid(),
  boardId: z.string().uuid(),
  teamId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  boardPath: z.string(),
})

export async function createTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const parsed = CreateTaskSchema.safeParse({
    columnId: formData.get('columnId'),
    boardId: formData.get('boardId'),
    teamId: formData.get('teamId'),
    title: formData.get('title'),
    boardPath: formData.get('boardPath'),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { message: 'Not authenticated' }

  const { columnId, boardId, teamId, title, boardPath } = parsed.data

  const { data: tasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPos = tasks && tasks.length > 0 ? tasks[0].position + 1 : 0

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      column_id: columnId,
      board_id: boardId,
      team_id: teamId,
      title: title.trim(),
      position: nextPos,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { message: error.message }

  await supabase.from('task_activity').insert({
    task_id: data.id,
    user_id: user.id,
    type: 'created',
    payload: { title },
  })

  revalidatePath(boardPath)
  return { taskId: data.id }
}

export async function updateTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const taskId = formData.get('taskId') as string
  const boardPath = formData.get('boardPath') as string
  if (!taskId || !boardPath) return { message: 'Missing required fields' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { message: 'Not authenticated' }

  const updates: {
    title?: string
    description?: string | null
    priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
    due_date?: string | null
  } = {}
  const title = formData.get('title')
  const description = formData.get('description')
  const priority = formData.get('priority')
  const dueDate = formData.get('due_date')

  if (title) {
    const t = title.toString().trim()
    if (t.length < 1 || t.length > 200) return { errors: { title: ['Title must be 1-200 characters'] } }
    updates.title = t
  }
  if (description !== null) updates.description = description?.toString().trim() || null
  if (priority) {
    const valid = ['urgent', 'high', 'medium', 'low', 'none'] as const
    const p = priority.toString() as 'urgent' | 'high' | 'medium' | 'low' | 'none'
    if (!valid.includes(p)) return { message: 'Invalid priority' }
    updates.priority = p
  }
  if (dueDate !== null) updates.due_date = dueDate?.toString() || null

  if (Object.keys(updates).length === 0) return {}

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
  if (error) return { message: error.message }

  revalidatePath(boardPath)
  return {}
}

export async function deleteTask(formData: FormData): Promise<void> {
  const taskId = formData.get('taskId') as string | null
  const boardPath = formData.get('boardPath') as string | null
  if (!taskId || !boardPath) return

  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', taskId)
  revalidatePath(boardPath)
}

export async function moveTask(
  taskId: string,
  newColumnId: string,
  newPosition: number,
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('tasks')
    .update({ column_id: newColumnId, position: newPosition })
    .eq('id', taskId)
  revalidatePath(boardPath)
}

export async function reorderTasksInColumn(
  columnId: string,
  orderedIds: string[],
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('tasks').update({ position: index }).eq('id', id).eq('column_id', columnId)
    )
  )
  revalidatePath(boardPath)
}

export async function addAssignee(
  taskId: string,
  userId: string,
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('task_assignees').upsert({ task_id: taskId, user_id: userId })
  revalidatePath(boardPath)
}

export async function removeAssignee(
  taskId: string,
  userId: string,
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', userId)
  revalidatePath(boardPath)
}
