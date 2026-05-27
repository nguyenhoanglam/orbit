'use client'

// dnd-kit generates aria-describedby IDs using a counter that differs between
// SSR and client, causing React hydration mismatches. This wrapper uses
// next/dynamic with ssr: false so dnd-kit only runs in the browser.

import dynamic from 'next/dynamic'
import type { KanbanBoardProps } from './KanbanBoard'

const KanbanBoard = dynamic(
  () => import('@/components/KanbanBoard').then((m) => m.KanbanBoard),
  { ssr: false }
)

export function KanbanBoardClient(props: KanbanBoardProps) {
  return <KanbanBoard {...props} />
}
