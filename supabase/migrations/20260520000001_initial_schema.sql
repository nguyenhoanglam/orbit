-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (mirrors auth.users, extended with profile data)
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  logo_url         text,
  stripe_customer_id text unique,
  created_by       uuid not null references public.profiles(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.teams enable row level security;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create type public.team_role as enum ('admin', 'member', 'viewer');

create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.team_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table public.team_members enable row level security;

-- RLS: members can see other members of their own teams
create policy "Team members visible to own team"
  on public.team_members for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
    )
  );

-- RLS: teams visible to members
create policy "Teams visible to members"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = teams.id and user_id = auth.uid()
    )
  );

create policy "Team admins can update team"
  on public.teams for update
  using (
    exists (
      select 1 from public.team_members
      where team_id = teams.id and user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- TEAM INVITES
-- ============================================================
create table public.team_invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  email      text not null,
  role       public.team_role not null default 'member',
  token      text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

alter table public.team_invites enable row level security;

create policy "Team admins can manage invites"
  on public.team_invites for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = team_invites.team_id and user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- WORKSPACES
-- ============================================================
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "Workspace visible to team members"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = workspaces.team_id and user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage workspaces"
  on public.workspaces for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = workspaces.team_id
        and user_id = auth.uid()
        and role in ('admin', 'member')
    )
  );

-- ============================================================
-- BOARDS
-- ============================================================
create table public.boards (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  name         text not null,
  description  text,
  position     integer not null default 0,
  created_by   uuid not null references public.profiles(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "Boards visible to team members"
  on public.boards for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = boards.team_id and user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage boards"
  on public.boards for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = boards.team_id
        and user_id = auth.uid()
        and role in ('admin', 'member')
    )
  );

-- ============================================================
-- COLUMNS (board swimlanes)
-- ============================================================
create table public.columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.columns enable row level security;

create policy "Columns visible to board's team members"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards b
      join public.team_members tm on tm.team_id = b.team_id
      where b.id = columns.board_id and tm.user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage columns"
  on public.columns for all
  using (
    exists (
      select 1 from public.boards b
      join public.team_members tm on tm.team_id = b.team_id
      where b.id = columns.board_id
        and tm.user_id = auth.uid()
        and tm.role in ('admin', 'member')
    )
  );

-- ============================================================
-- LABELS
-- ============================================================
create table public.labels (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  created_at timestamptz not null default now()
);

alter table public.labels enable row level security;

create policy "Labels visible to team members"
  on public.labels for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = labels.team_id and user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage labels"
  on public.labels for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = labels.team_id
        and user_id = auth.uid()
        and role in ('admin', 'member')
    )
  );

-- ============================================================
-- TASKS
-- ============================================================
create type public.task_priority as enum ('urgent', 'high', 'medium', 'low', 'none');

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  column_id   uuid not null references public.columns(id) on delete restrict,
  team_id     uuid not null references public.teams(id) on delete cascade,
  title       text not null,
  description text,
  priority    public.task_priority not null default 'none',
  due_date    date,
  position    integer not null default 0,
  created_by  uuid not null references public.profiles(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Tasks visible to team members"
  on public.tasks for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = tasks.team_id and user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage tasks"
  on public.tasks for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = tasks.team_id
        and user_id = auth.uid()
        and role in ('admin', 'member')
    )
  );

-- ============================================================
-- TASK ASSIGNEES
-- ============================================================
create table public.task_assignees (
  task_id    uuid not null references public.tasks(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

alter table public.task_assignees enable row level security;

create policy "Task assignees visible to team members"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_assignees.task_id and tm.user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage task assignees"
  on public.task_assignees for all
  using (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_assignees.task_id
        and tm.user_id = auth.uid()
        and tm.role in ('admin', 'member')
    )
  );

-- ============================================================
-- TASK LABELS (join table)
-- ============================================================
create table public.task_labels (
  task_id    uuid not null references public.tasks(id) on delete cascade,
  label_id   uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

alter table public.task_labels enable row level security;

create policy "Task labels visible to team members"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_labels.task_id and tm.user_id = auth.uid()
    )
  );

create policy "Team admins/members can manage task labels"
  on public.task_labels for all
  using (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_labels.task_id
        and tm.user_id = auth.uid()
        and tm.role in ('admin', 'member')
    )
  );

-- ============================================================
-- TASK ACTIVITY LOG
-- ============================================================
create table public.task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete restrict,
  type       text not null, -- 'status_change' | 'assignment' | 'comment' | 'priority_change' | etc.
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.task_activity enable row level security;

create policy "Task activity visible to team members"
  on public.task_activity for select
  using (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_activity.task_id and tm.user_id = auth.uid()
    )
  );

create policy "Team members can insert activity"
  on public.task_activity for insert
  with check (
    exists (
      select 1 from public.tasks t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = task_activity.task_id and tm.user_id = auth.uid()
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create type public.subscription_plan as enum ('lite', 'pro');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  team_id              uuid not null references public.teams(id) on delete cascade unique,
  plan                 public.subscription_plan not null default 'lite',
  status               public.subscription_status not null default 'active',
  stripe_subscription_id text unique,
  stripe_price_id      text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Team admins can view subscription"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = subscriptions.team_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER: auto-update updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_teams_updated
  before update on public.teams
  for each row execute procedure public.handle_updated_at();

create trigger on_workspaces_updated
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

create trigger on_boards_updated
  before update on public.boards
  for each row execute procedure public.handle_updated_at();

create trigger on_columns_updated
  before update on public.columns
  for each row execute procedure public.handle_updated_at();

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- HELPER: create profile on new user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
