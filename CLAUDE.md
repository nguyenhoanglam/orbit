@AGENTS.md

# Orbit

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Database**: Supabase (Postgres, Auth, Storage) — local Docker first
- **Payments**: Stripe (Lite + Pro subscription plans)
- **Email**: Resend
- **AI**: Vercel AI SDK
- **Package Manager**: pnpm

## Common Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint

# Supabase
pnpm supabase start          # Start local Supabase via Docker
pnpm supabase stop           # Stop local Supabase
pnpm supabase db reset       # Reset DB and re-run all migrations
pnpm supabase gen types typescript --local > types/database.ts  # Regenerate DB types
```

## Project Structure

```
app/                        # Next.js App Router — pages and layouts only
  (auth)/                   # Public auth routes (login, signup, onboarding)
  (app)/                    # Authenticated app routes (wrapped in auth check)
    [teamSlug]/             # Team-scoped pages
      boards/[boardId]/     # Kanban board page
  api/                      # API route handlers (e.g., Stripe webhooks)
  layout.tsx                # Root layout (no 'use client')
  globals.css               # Global styles and Tailwind entry point
components/                 # Shared UI components (named exports, one per file)
  ui/                       # Shadcn UI primitives (DO NOT edit manually — use CLI)
lib/                        # Shared utilities, helpers, constants
  supabase/                 # Supabase client helpers (server.ts, client.ts)
  stripe.ts                 # Stripe SDK instance
  resend.ts                 # Resend SDK instance
  plans.ts                  # Plan feature gates (Lite vs Pro)
hooks/                      # Custom React hooks (Client-side only)
types/                      # Shared TypeScript types
  database.ts               # Auto-generated Supabase DB types (do not edit)
supabase/                   # Supabase config and migrations
  migrations/               # SQL migration files
public/                     # Static assets (images, icons, fonts)
```

## Next.js & React

- All components are **Server Components by default** — only add `'use client'` when the component uses browser APIs, event handlers, or React hooks.
- Place `'use client'` as close to the leaf as possible — keep Server Components wrapping Client Components.
- Layouts (`layout.tsx`) must never be marked `'use client'`.
- Pages (`app/**/page.tsx`) use default exports; all other components use named exports.
- One component per file, PascalCase filename matching the component name.
- Fetch data directly in `async` Server Components — do not use `getServerSideProps`, `getStaticProps`, or `useEffect` for data fetching.
- Always use `next/image` with explicit `width` and `height`. Use `next/font/google` for fonts.

## TypeScript

- **Strict mode** is on — never disable checks or use `@ts-ignore` without an explanatory comment.
- Prefer `interface` for object shapes; use `type` for unions, intersections, and aliases.
- Never use `any`. Use `unknown` and narrow it before use.
- Use the `@/*` path alias for all project imports (e.g., `import { Button } from "@/components/Button"`).
- Avoid type assertions (`as Foo`); prefer type guards.
- Avoid `enum`; use `const` objects with `as const` or union string literals.

## Tailwind CSS

- **Tailwind CSS v4**: import with `@import "tailwindcss"` (not `@tailwind base/components/utilities`).
- Define design tokens in `@theme inline { ... }` using CSS custom properties (see `globals.css`).
- Use CSS variables for colors that need dark mode variants; override in `@media (prefers-color-scheme: dark)`.
- Compose utilities directly in JSX `className` — do not use `@apply`.
- Use responsive prefixes (`sm:`, `md:`, `lg:`) mobile-first.

## Shadcn UI

- Add components via CLI: `pnpm dlx shadcn@latest add <component>` — never copy-paste or manually edit files in `components/ui/`.
- Shadcn components live in `components/ui/` and use CSS variables already defined in `globals.css`.
- Extend or compose Shadcn primitives in `components/` — do not modify `components/ui/` directly.
- Dark mode is default; theme class is managed on `<html>` element (`dark` class).

## File & Folder Rules

- Keep `app/` for routing only — no business logic or reusable components.
- Place reusable components in `components/` (PascalCase filenames).
- Place utilities and constants in `lib/`; custom hooks in `hooks/` (prefixed with `use`).
- No barrel files (`index.ts` re-exports) — import directly from source files.
- Group related files into subdirectories when a feature grows beyond 3 files.

## Supabase

- Use **two separate clients**: `lib/supabase/server.ts` (Server Components, actions, API routes) and `lib/supabase/client.ts` (Client Components only).
- Always enable **Row Level Security (RLS)** on every table; never query without it in place.
- Migrations live in `supabase/migrations/` — never mutate the DB schema directly; always create a new migration file.
- After changing schema, regenerate types: `pnpm supabase gen types typescript --local > types/database.ts`.
- Use `database.ts` types for all DB query results — never use `any` or manual type casting.

## Stripe

- The Stripe SDK instance is a singleton exported from `lib/stripe.ts`.
- Use **server actions or API routes** for all Stripe operations — never expose the secret key to the client.
- Webhook handler lives at `app/api/stripe/webhook/route.ts`; always verify the signature with `stripe.webhooks.constructEvent`.
- Plan feature gates are centralised in `lib/plans.ts` — use this to check entitlements, never inline.
- Store `stripe_customer_id` on the team record; store subscription status in the `subscriptions` table.

## Resend

- The Resend SDK instance is exported from `lib/resend.ts`.
- Email templates are React components in `emails/` (plain `.tsx` files, not Next.js pages).
- Send emails only from **Server Components, server actions, or API routes** — never from the client.

## AI SDK

- Use the Vercel AI SDK (`ai` package) with a server-side provider configured in `lib/ai.ts`.
- Stream responses with `streamText`; consume on the client with `useStreamableValue` or `useChat`.
- All AI features are gated behind the **Pro plan** — check entitlement via `lib/plans.ts` before invoking.
- Never send raw user data to the AI provider without sanitising it first.
