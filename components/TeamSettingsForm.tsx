'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTeam, type TeamState } from '@/lib/actions/team'

interface TeamSettingsFormProps {
  teamId: string
  teamSlug: string
  initialName: string
  isAdmin: boolean
}

export function TeamSettingsForm({ teamId, teamSlug, initialName, isAdmin }: TeamSettingsFormProps) {
  const [state, action, pending] = useActionState<TeamState, FormData>(updateTeam, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="teamSlug" value={teamSlug} />
      <div className="space-y-1.5">
        <Label htmlFor="team-name">Team name</Label>
        <Input
          id="team-name"
          name="name"
          defaultValue={initialName}
          disabled={!isAdmin}
          required
        />
        {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state.success && <p className="text-sm text-green-600 dark:text-green-400">Team updated.</p>}
      {isAdmin && (
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save changes'}
        </Button>
      )}
    </form>
  )
}
