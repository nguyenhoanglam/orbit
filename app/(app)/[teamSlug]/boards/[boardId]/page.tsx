import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ teamSlug: string; boardId: string }>
}

export default async function BoardPage({ params }: Props) {
  const { teamSlug, boardId } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('boards')
    .select('id, name, description')
    .eq('id', boardId)
    .single()

  if (!board) redirect(`/${teamSlug}`)

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
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Kanban board coming in Milestone 4.</p>
      </div>
    </div>
  )
}
