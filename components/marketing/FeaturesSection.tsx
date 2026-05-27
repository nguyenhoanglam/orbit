import {
  LayoutGrid,
  Sparkles,
  Users,
  Flag,
  GripVertical,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'Kanban boards',
    description:
      'Visualize your workflow with beautiful, flexible boards. Create columns that match how your team actually works.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered workflows',
    description:
      'Generate task descriptions, break epics into subtasks, and auto-assign work — all driven by AI on the Pro plan.',
  },
  {
    icon: Users,
    title: 'Team collaboration',
    description:
      'Invite your whole team, assign tasks, leave comments, and stay in sync without the noise.',
  },
  {
    icon: Flag,
    title: 'Priority management',
    description:
      'Mark tasks Urgent, High, Medium, or Low. Filter your view to focus on what matters most today.',
  },
  {
    icon: GripVertical,
    title: 'Real-time drag & drop',
    description:
      'Reorder tasks and columns instantly with silky-smooth drag and drop powered by @dnd-kit.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description:
      'Admin, Member, and Viewer roles with row-level security enforced at the database. Your data stays yours.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#09090B] py-24">
      {/* Subtle section separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <div className="mb-16 max-w-xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#5E6AD2]">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for the way
            <br />
            <span className="text-zinc-400">modern teams work.</span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group relative bg-[#09090B] p-8 transition-colors hover:bg-white/[0.02]"
            >
              {/* Top border accent on hover */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5E6AD2]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors group-hover:border-[#5E6AD2]/30 group-hover:bg-[#5E6AD2]/10 group-hover:text-[#818CF8]">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
            </div>
          ))}
        </div>

        {/* Grid border overlay */}
        <div className="pointer-events-none absolute inset-x-6 inset-y-24 rounded-2xl border border-white/[0.04]" />
      </div>
    </section>
  )
}
