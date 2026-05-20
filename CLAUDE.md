@AGENTS.md

# Orbit

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm

## Common Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

## Project Structure

```
app/                  # Next.js App Router — pages and layouts only
  layout.tsx          # Root layout (no 'use client')
  page.tsx            # Route pages (default export)
  globals.css         # Global styles and Tailwind entry point
components/           # Shared UI components (named exports, one per file)
lib/                  # Shared utilities, helpers, constants
hooks/                # Custom React hooks (Client-side only)
public/               # Static assets (images, icons, fonts)
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

## File & Folder Rules

- Keep `app/` for routing only — no business logic or reusable components.
- Place reusable components in `components/` (PascalCase filenames).
- Place utilities and constants in `lib/`; custom hooks in `hooks/` (prefixed with `use`).
- No barrel files (`index.ts` re-exports) — import directly from source files.
- Group related files into subdirectories when a feature grows beyond 3 files.
