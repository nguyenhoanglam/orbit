/**
 * Plan definitions and feature gates for Orbit.
 *
 * Lite (free): up to 3 boards, up to 5 team members, no AI features.
 * Pro  (paid): unlimited boards, unlimited members, AI features enabled.
 */

export type Plan = 'lite' | 'pro'

export interface PlanLimits {
  maxBoards: number | null      // null = unlimited
  maxMembers: number | null     // null = unlimited
  aiEnabled: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  lite: {
    maxBoards: 3,
    maxMembers: 5,
    aiEnabled: false,
  },
  pro: {
    maxBoards: null,
    maxMembers: null,
    aiEnabled: true,
  },
}

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.lite
}

export function canCreateBoard(plan: Plan, currentBoardCount: number): boolean {
  const limits = getLimits(plan)
  if (limits.maxBoards === null) return true
  return currentBoardCount < limits.maxBoards
}

export function canAddMember(plan: Plan, currentMemberCount: number): boolean {
  const limits = getLimits(plan)
  if (limits.maxMembers === null) return true
  return currentMemberCount < limits.maxMembers
}

export const PLAN_DISPLAY = {
  lite: {
    name: 'Lite',
    price: 'Free',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 3 boards',
      'Up to 5 team members',
      'Kanban boards with drag & drop',
      'Task management',
      'Team collaboration',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$12/month',
    description: 'For growing teams that need more power',
    features: [
      'Unlimited boards',
      'Unlimited team members',
      'Everything in Lite',
      'AI task description generation',
      'AI task breakdown',
      'Priority support',
    ],
  },
} as const
