'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const BoardSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  workspaceId: z.string().uuid(),
  teamSlug: z.string(),
})

const UpdateBoardSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1, 'Name is required.').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  teamSlug: z.string(),
})

const DeleteBoardSchema = z.object({
  boardId: z.string().uuid(),
  teamSlug: z.string(),
})

export interface BoardState {
  errors?: Record<string, string[]>
  message?: string
}

export async function createBoard(
  _prev: BoardState,
  formData: FormData
): Promise<BoardState> {
  const parsed = BoardSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    workspaceId: formData.get('workspaceId'),
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorised.' }

  const { name, description, workspaceId, teamSlug } = parsed.data

  // Get team id from slug
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', teamSlug)
    .single()

  if (!team) return { message: 'Team not found.' }

  // Get max position
  const { data: boards } = await supabase
    .from('boards')
    .select('position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: false })
    .limit(1)

  const position = ((boards as Array<{ position: number }> | null)?.[0]?.position ?? -1) + 1

  const { error } = await supabase.from('boards').insert({
    workspace_id: workspaceId,
    team_id: team.id,
    name,
    description: description ?? null,
    position,
    created_by: user.id,
  })

  if (error) return { message: 'Failed to create board.' }

  revalidatePath(`/${teamSlug}`)
  return {}
}

export async function updateBoard(
  _prev: BoardState,
  formData: FormData
): Promise<BoardState> {
  const parsed = UpdateBoardSchema.safeParse({
    boardId: formData.get('boardId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorised.' }

  const { boardId, name, description, teamSlug } = parsed.data

  const { error } = await supabase
    .from('boards')
    .update({ name, description: description ?? null })
    .eq('id', boardId)

  if (error) return { message: 'Failed to update board.' }

  revalidatePath(`/${teamSlug}`)
  return {}
}

export async function deleteBoard(formData: FormData): Promise<void> {
  const parsed = DeleteBoardSchema.safeParse({
    boardId: formData.get('boardId'),
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('boards').delete().eq('id', parsed.data.boardId)

  revalidatePath(`/${parsed.data.teamSlug}`)
}
