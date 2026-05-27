'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ColState {
  errors?: { name?: string[] }
  message?: string
}

const CreateColumnSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(50),
  teamSlug: z.string(),
  boardId2: z.string().optional(),
})

export async function createColumn(_prev: ColState, formData: FormData): Promise<ColState> {
  const boardId = formData.get('boardId') as string
  const name = formData.get('name') as string
  const teamSlug = formData.get('teamSlug') as string
  const boardPath = formData.get('boardPath') as string

  if (!boardId || !name || !teamSlug) return { message: 'Missing required fields' }
  if (name.length < 1 || name.length > 50) return { errors: { name: ['Name must be 1-50 characters'] } }

  const supabase = await createClient()

  const { data: cols } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPos = cols && cols.length > 0 ? cols[0].position + 1 : 0

  const { error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, name: name.trim(), position: nextPos })

  if (error) return { message: error.message }
  revalidatePath(boardPath ?? `/${teamSlug}`)
  return {}
}

export async function updateColumn(_prev: ColState, formData: FormData): Promise<ColState> {
  const columnId = formData.get('columnId') as string
  const name = formData.get('name') as string
  const boardPath = formData.get('boardPath') as string

  if (!columnId || !name) return { message: 'Missing required fields' }
  if (name.length < 1 || name.length > 50) return { errors: { name: ['Name must be 1-50 characters'] } }

  const supabase = await createClient()
  const { error } = await supabase.from('columns').update({ name: name.trim() }).eq('id', columnId)

  if (error) return { message: error.message }
  revalidatePath(boardPath)
  return {}
}

export async function deleteColumn(formData: FormData): Promise<void> {
  const columnId = formData.get('columnId') as string | null
  const boardPath = formData.get('boardPath') as string | null
  if (!columnId || !boardPath) return

  const supabase = await createClient()
  await supabase.from('columns').delete().eq('id', columnId)
  revalidatePath(boardPath)
}

export async function reorderColumns(
  boardId: string,
  orderedIds: string[],
  boardPath: string
): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('columns').update({ position: index }).eq('id', id).eq('board_id', boardId)
    )
  )
  revalidatePath(boardPath)
}
