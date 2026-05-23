import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getLimits } from '@/lib/plans'
import type { KanbanColumn, KanbanTask, KanbanMember, KanbanLabel } from '@/components/KanbanBoard'
import type { Plan } from '@/lib/plans'

// dnd-kit generates aria IDs via a counter that differs between SSR and client,
// causing hydration mismatches. Load the board only on the client.
const KanbanBoard = dynamic(
  () => import('@/components/KanbanBoard').then((m) => m.KanbanBoard),
  { ssr: false }
)

interface Props {
  params: Promise<{ teamSlug: string; boardId: string }>
}

export default async function BoardPage({ params }: Props) {
  const { teamSlug, boardId } = await params
  const supabase = await createClient()
  const boardPath = `/${teamSlug}/boards/${boardId}`

  const { data: board } = await supabase
    .from('boards')
    .select('id, name, description, team_id')
    .eq('id', boardId)
    .single()

  if (!board) redirect(`/${teamSlug}`)

  const [columnsResult, membersRes, labelsRes, subscriptionRes] = await Promise.all([
    supabase
      .from('columns')
      .select(`
        id, board_id, name, position,
        tasks(
          id, column_id, board_id, team_id, title, description, priority, due_date, position, created_by, created_at,
          task_assignees(user_id, profiles(display_name, email, avatar_url)),
          task_labels(label_id, labels(id, name, color))
        )
      `)
      .eq('board_id', boardId)
      .order('position')
      .order('position', { referencedTable: 'tasks' }),

    supabase
      .from('team_members')
      .select('user_id, role, profiles(id, display_name, email, avatar_url)')
      .eq('team_id', board.team_id),

    supabase.from('labels').select('id, name, color').eq('team_id', board.team_id),
    supabase.from('subscriptions').select('plan').eq('team_id', board.team_id).single(),
  ])

  const rawColumns = (columnsResult.data ?? []) as unknown as Array<{
    id: string
    board_id: string
    name: string
    position: number
    tasks: KanbanTask[]
  }>

  const initialColumns: KanbanColumn[] = rawColumns.map((col) => ({
    ...col,
    tasks: (col.tasks ?? []).sort((a, b) => a.position - b.position),
  }))

  const members = (membersRes.data ?? []) as unknown as KanbanMember[]
  const teamLabels = (labelsRes.data ?? []) as KanbanLabel[]
  const plan = (subscriptionRes.data?.plan ?? 'lite') as Plan
  const aiEnabled = getLimits(plan).aiEnabled

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-muted-foreground">{board.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <KanbanBoard
          initialColumns={initialColumns}
          boardId={boardId}
          teamId={board.team_id}
          teamSlug={teamSlug}
          boardPath={boardPath}
          members={members}
          teamLabels={teamLabels}
          aiEnabled={aiEnabled}
        />
      </div>
    </div>
  )
}
