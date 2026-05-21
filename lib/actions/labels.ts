'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface LabelState {
  errors?: { name?: string[] }
  message?: string
}

export async function createLabel(_prev: LabelState, formData: FormData): Promise<LabelState> {
  const teamId = formData.get('teamId') as string
  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const boardPath = formData.get('boardPath') as string

  if (!teamId || !name || !color || !boardPath) return { message: 'Missing required fields' }
  if (name.length < 1 || name.length > 30) return { errors: { name: ['Name must be 1-30 characters'] } }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { message: 'Invalid color' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('labels')
    .insert({ team_id: teamId, name: name.trim(), color })

  if (error) return { message: error.message }
  revalidatePath(boardPath)
  return {}
}

export async function deleteLabel(formData: FormData): Promise<void> {
  const labelId = formData.get('labelId') as string | null
  const boardPath = formData.get('boardPath') as string | null
  if (!labelId || !boardPath) return

  const supabase = await createClient()
  await supabase.from('labels').delete().eq('id', labelId)
  revalidatePath(boardPath)
}

export async function addTaskLabel(
  taskId: string,
  labelId: string,
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('task_labels').upsert({ task_id: taskId, label_id: labelId })
  revalidatePath(boardPath)
}

export async function removeTaskLabel(
  taskId: string,
  labelId: string,
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('task_labels').delete().eq('task_id', taskId).eq('label_id', labelId)
  revalidatePath(boardPath)
}
