# Orbit — Implementation Plan

## Overview

Build a Linear-inspired project management app (Orbit) on top of a fresh Next.js 16 boilerplate.

**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · Shadcn UI · Supabase · Stripe · Resend · Vercel AI SDK

---

## Milestone 1 — Foundation & Infrastructure

Goal: Every subsequent milestone builds on a solid, runnable base.

- [x] Install and configure Shadcn UI (`components.json`, update `globals.css` theming)
- [x] Dark mode by default with light mode toggle (theme stored in cookie)
- [x] Add Supabase Docker Compose config, `.env.local` template, install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Design and write initial SQL migrations: `users`, `teams`, `team_members`, `workspaces`, `boards`, `columns`, `tasks`, `task_assignees`, `labels`, `subscriptions`
- [x] Generate TypeScript types from Supabase schema → `types/database.ts`
- [x] Scaffold new folders: `types/`, `db/`, `supabase/migrations/`, `emails/`; update project structure docs

---

## Milestone 2 — Auth & Onboarding

Goal: Users can sign up, log in, create a team, and receive a welcome email.

- [ ] Install packages: `resend`, `zod`; add Shadcn components: `form`, `input`, `label`, `card`, `separator`
- [ ] `middleware.ts` — session refresh + protect all routes except auth pages
- [ ] `lib/supabase/middleware.ts` — Supabase client helper for use inside middleware
- [ ] `app/(auth)/layout.tsx` — centred card layout for all auth pages
- [ ] `app/(auth)/login/page.tsx` — email/password + magic link tabs, uses `lib/actions/auth.ts`
- [ ] `app/(auth)/signup/page.tsx` — email/password signup form, uses `lib/actions/auth.ts`
- [ ] `app/(auth)/callback/route.ts` — handles magic link and email confirmation redirects from Supabase
- [ ] `lib/actions/auth.ts` — server actions: `login`, `signup`, `loginWithMagicLink`, `logout`; validated with Zod
- [ ] `app/onboarding/page.tsx` — 3-step wizard: (1) display name, (2) team name + slug, (3) optional invites
- [ ] `lib/actions/onboarding.ts` — server action: create team + workspace + set admin role + Lite subscription row
- [ ] `lib/resend.ts` — Resend SDK singleton (no-op when `RESEND_API_KEY` is absent for local dev)
- [ ] `emails/WelcomeEmail.tsx` — React Email welcome template
- [ ] `app/page.tsx` — smart redirect: authenticated+team → `/(app)/[slug]`; authenticated no team → `/onboarding`; guest → `/login`

---

## Milestone 3 — Workspace & Boards

Goal: Authenticated users can create and navigate workspaces and boards.

- [ ] Authenticated app shell: sidebar (team switcher, nav links) + topbar at `app/(app)/layout.tsx`
- [ ] Workspace home page listing all boards (`app/(app)/[teamSlug]/page.tsx`)
- [ ] Board CRUD server actions + board settings modal
- [ ] Team settings page (rename team, manage members, roles: admin/member/viewer)
- [ ] Invite member by email; Resend invite email; pending invite DB table

---

## Milestone 4 — Kanban & Tasks

Goal: Core product — interactive kanban boards with full task management.

- [ ] Kanban board page with column layout (`app/(app)/[teamSlug]/boards/[boardId]/page.tsx`)
- [ ] Drag-and-drop columns and tasks via `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Task CRUD server actions with optimistic UI (`useOptimistic`)
- [ ] Task detail drawer: title, description (rich text), assignees, labels, priority, due date, status
- [ ] Label CRUD; priority enum: Urgent / High / Medium / Low / None
- [ ] Task activity log (status changes, assignments, comments)

---

## Milestone 5 — Billing & Subscriptions

Goal: Monetize with Lite (free) and Pro (paid) tiers via Stripe.

- [ ] Install `stripe` SDK; create Lite/Pro products + prices in Stripe dashboard; store IDs in env
- [ ] Pricing / upgrade page showing Lite vs Pro features
- [ ] Stripe Checkout Session server action + success/cancel redirect pages
- [ ] Stripe webhook handler (`app/api/stripe/webhook/route.ts`) updating `subscriptions` table
- [ ] Customer portal link for managing subscription
- [ ] Plan feature gates via `lib/plans.ts` (enforce board/member limits per tier)

---

## Milestone 6 — AI Features

Goal: AI-assisted productivity (Pro plan only) using Vercel AI SDK.

- [ ] Install `ai` package; configure provider (OpenAI or Anthropic); add API key to env
- [ ] AI-generated task description from a short title prompt (streaming text)
- [ ] AI task breakdown: split an epic into sub-tasks
- [ ] AI-powered search across boards and tasks
