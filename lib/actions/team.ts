'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/resend'
import { canAddMember } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

// ── Team settings ─────────────────────────────────────────────

const UpdateTeamSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(2, 'Team name must be at least 2 characters.').max(100).trim(),
  teamSlug: z.string(),
})

export interface TeamState {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function updateTeam(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const parsed = UpdateTeamSchema.safeParse({
    teamId: formData.get('teamId'),
    name: formData.get('name'),
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorised.' }

  const { teamId, name, teamSlug } = parsed.data

  const { error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)

  if (error) return { message: 'Failed to update team.' }

  revalidatePath(`/${teamSlug}/settings`)
  return { success: true }
}

// ── Member role ───────────────────────────────────────────────

const UpdateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['admin', 'member', 'viewer']),
  teamSlug: z.string(),
})

export async function updateMemberRole(formData: FormData): Promise<TeamState> {
  const parsed = UpdateMemberRoleSchema.safeParse({
    memberId: formData.get('memberId'),
    role: formData.get('role'),
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) return { message: 'Invalid data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorised.' }

  const { memberId, role, teamSlug } = parsed.data

  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('id', memberId)

  if (error) return { message: 'Failed to update role.' }

  revalidatePath(`/${teamSlug}/settings`)
  return { success: true }
}

// ── Remove member ─────────────────────────────────────────────

export async function removeMember(formData: FormData): Promise<void> {
  const memberId = formData.get('memberId') as string | null
  const teamSlug = formData.get('teamSlug') as string | null
  if (!memberId || !teamSlug) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('team_members').delete().eq('id', memberId)
  revalidatePath(`/${teamSlug}/settings`)
}

// ── Invite member ─────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email('Invalid email address.').trim().toLowerCase(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  teamId: z.string().uuid(),
  teamSlug: z.string(),
})

export interface InviteState {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function inviteMember(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const parsed = InviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role') || 'member',
    teamId: formData.get('teamId'),
    teamSlug: formData.get('teamSlug'),
  })

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorised.' }

  const { email, role, teamId, teamSlug } = parsed.data

  // Get inviter's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single()

  if (!team) return { message: 'Team not found.' }

  // Enforce plan limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('team_id', teamId)
    .single()

  const plan = (subscription?.plan ?? 'lite') as Plan
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (!canAddMember(plan, memberCount ?? 0)) {
    return { message: 'You have reached the member limit for the Lite plan. Upgrade to Pro for unlimited members.' }
  }

  // Upsert invite (reset expiry if reinviting)
  const { data: invite, error } = await supabase
    .from('team_invites')
    .upsert(
      { team_id: teamId, email, role, invited_by: user.id },
      { onConflict: 'team_id,email', ignoreDuplicates: false }
    )
    .select('token')
    .single()

  if (error || !invite) return { message: 'Failed to create invite.' }

  // Send invite email (best-effort)
  await sendInviteEmail({
    to: email,
    inviterName: profile?.display_name ?? profile?.email ?? 'A teammate',
    teamName: team.name,
    token: invite.token,
  })

  revalidatePath(`/${teamSlug}/settings`)
  return { success: true }
}
