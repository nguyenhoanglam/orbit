import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { getTeamData } from '@/lib/queries'
import { CreateBoardDialog } from '@/components/CreateBoardDialog'
import { BoardMenu } from '@/components/BoardMenu'

interface Props {
  params: Promise<{ teamSlug: string }>
}

export default async function WorkspacePage({ params }: Props) {
  const { teamSlug } = await params
  const { team, workspaces, boards, membership } = await getTeamData(teamSlug)

  const canEdit = membership.role === 'admin' || membership.role === 'member'
  const defaultWorkspace = workspaces[0]

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">All boards</p>
        </div>
        {canEdit && defaultWorkspace && (
          <CreateBoardDialog workspaceId={defaultWorkspace.id} teamSlug={teamSlug} />
        )}
      </div>

      {/* Boards grid */}
      <div className="flex-1 p-6">
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-base font-medium">No boards yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {canEdit ? 'Create your first board to get started.' : 'No boards have been created yet.'}
            </p>
            {canEdit && defaultWorkspace && (
              <div className="mt-4">
                <CreateBoardDialog workspaceId={defaultWorkspace.id} teamSlug={teamSlug} />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <Link
                  href={`/${teamSlug}/boards/${board.id}`}
                  className="flex flex-1 flex-col gap-1 before:absolute before:inset-0 before:rounded-lg"
                >
                  <h3 className="font-medium leading-tight">{board.name}</h3>
                  {board.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{board.description}</p>
                  )}
                </Link>
                {canEdit && (
                  <div className="relative z-10 mt-3 flex justify-end">
                    <BoardMenu
                      board={{ id: board.id, name: board.name, description: board.description ?? null }}
                      teamSlug={teamSlug}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
