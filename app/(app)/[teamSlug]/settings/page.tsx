import { getTeamData, getTeamMembers, getPendingInvites } from '@/lib/queries'
import { TeamSettingsForm } from '@/components/TeamSettingsForm'
import { MembersTable } from '@/components/MembersTable'
import { PendingInvitesTable } from '@/components/PendingInvitesTable'
import { InviteMemberDialog } from '@/components/InviteMemberDialog'
import { Separator } from '@/components/ui/separator'

interface Props {
  params: Promise<{ teamSlug: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { teamSlug } = await params
  const { team, membership } = await getTeamData(teamSlug)

  const isAdmin = membership.role === 'admin'
  const [members, invites] = await Promise.all([
    getTeamMembers(team.id),
    isAdmin ? getPendingInvites(team.id) : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your team settings</p>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-8 p-6">
        {/* General */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">General</h2>
          <TeamSettingsForm
            teamId={team.id}
            teamSlug={teamSlug}
            initialName={team.name}
            isAdmin={isAdmin}
          />
        </section>

        <Separator />

        {/* Members */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Members</h2>
            {isAdmin && <InviteMemberDialog teamId={team.id} teamSlug={teamSlug} />}
          </div>
          <MembersTable members={members} teamSlug={teamSlug} isAdmin={isAdmin} />
        </section>

        {/* Pending invites */}
        {isAdmin && invites.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-base font-semibold">Pending invites</h2>
              <PendingInvitesTable invites={invites} teamSlug={teamSlug} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
