-- ============================================================
-- COMPREHENSIVE RLS AUDIT — Milestone 7 Production Hardening
-- ============================================================
--
-- Issues fixed:
--  1. Role restriction lost: the recursion fix used team_id = any(get_my_team_ids())
--     everywhere, removing viewer restrictions. Viewers (role='viewer') could
--     INSERT/UPDATE/DELETE. Now separated into SELECT (all members) vs mutate
--     (admin/member only) policies.
--  2. Missing WITH CHECK on UPDATE policies (old row checked but new row not).
--  3. Missing DELETE policies on teams, profiles, workspaces, boards, etc.
--  4. team_invites: FOR ALL policy included SELECT—replaced with granular ops.
--  5. task_assignees: no check that assignee is actually a team member.
--  6. subscriptions: ALL for "admins" used get_my_team_ids() (any member).
--     Separated into SELECT (all members) and INSERT/UPDATE (admins only).
--  7. task_activity: INSERT must enforce user_id = auth.uid().
--  8. profiles: missing INSERT and DELETE policies.
--
-- Design:
--  • Viewers  → SELECT only on all team data
--  • Members  → SELECT + INSERT + UPDATE
--  • Admins   → SELECT + INSERT + UPDATE + DELETE
--  • Stripe webhook uses service_role → bypasses RLS (no special policy needed)
--
-- Two new SECURITY DEFINER helpers avoid RLS recursion when checking roles:
--   public.is_team_admin(team_id)           → bool
--   public.is_team_admin_or_member(team_id) → bool
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Already exists from previous migration; keep get_my_team_ids()

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role = 'admin'
  )
$$;

create or replace function public.is_team_admin_or_member(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role in ('admin', 'member')
  )
$$;

-- Used to verify the target user_id is a member of a team (e.g. task assignees)
create or replace function public.is_team_member_by_id(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = p_user_id
  )
$$;

-- ============================================================
-- PROFILES
-- ============================================================
-- SELECT (true): profiles are semi-public within the app (name/avatar shown)
-- INSERT: user can only insert their own profile (trigger-created, but explicit for safety)
-- UPDATE: own profile only
-- DELETE: own profile only

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================================
-- TEAMS
-- ============================================================
-- SELECT: members or creator (already exists from previous migration)
-- INSERT: auth user, created_by = auth.uid() (already exists)
-- UPDATE: admin only — add WITH CHECK to prevent hijacking team identity
-- DELETE: admin only (new)

drop policy if exists "Team admins can update team" on public.teams;

create policy "Team admins can update team"
  on public.teams for update
  using  (public.is_team_admin(id))
  with check (public.is_team_admin(id));

create policy "Team admins can delete team"
  on public.teams for delete
  using (public.is_team_admin(id));

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
-- SELECT: own teams (already exists)
-- INSERT self: user adds themselves (onboarding / invite acceptance) — already exists
-- INSERT admin: admin adds others — already exists
-- UPDATE: admin only, with check — fix existing (was missing WITH CHECK)
-- DELETE own: user can leave the team (new)
-- DELETE admin: admin can remove others (already exists, rename to clarify)

drop policy if exists "Team admins can manage team members" on public.team_members;

create policy "Team admins can update team members"
  on public.team_members for update
  using  (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

create policy "Users can leave team"
  on public.team_members for delete
  using (user_id = auth.uid());

-- (keep existing "Team admins can remove team members" DELETE policy)

-- ============================================================
-- TEAM INVITES
-- ============================================================
-- SELECT (true): kept — 64-char hex token is the secret; server uses token lookup
-- INSERT: admin only (replaces the old FOR ALL "Team admins can manage invites")
-- UPDATE: admin OR invited-user email match (combined, replaces two separate policies)
-- DELETE: admin only

drop policy if exists "Team admins can manage invites"  on public.team_invites;
drop policy if exists "Invited user can accept invite"  on public.team_invites;

create policy "Team admins can insert invites"
  on public.team_invites for insert
  with check (public.is_team_admin(team_id));

create policy "Team admins can delete invites"
  on public.team_invites for delete
  using (public.is_team_admin(team_id));

create policy "Admins and invited user can update invite"
  on public.team_invites for update
  using (
    public.is_team_admin(team_id)
    OR lower(email) = lower(auth.email())
  )
  with check (
    public.is_team_admin(team_id)
    OR lower(email) = lower(auth.email())
  );

-- ============================================================
-- WORKSPACES
-- ============================================================
-- SELECT: any team member       (viewers included)
-- INSERT: admin or member only  (viewers excluded)
-- UPDATE: admin or member only, with check
-- DELETE: admin only

drop policy if exists "Workspace visible to team members"         on public.workspaces;
drop policy if exists "Team admins/members can manage workspaces" on public.workspaces;

create policy "Workspace visible to team members"
  on public.workspaces for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins/members can insert workspaces"
  on public.workspaces for insert
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins/members can update workspaces"
  on public.workspaces for update
  using  (public.is_team_admin_or_member(team_id))
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins can delete workspaces"
  on public.workspaces for delete
  using (public.is_team_admin(team_id));

-- ============================================================
-- BOARDS
-- ============================================================
drop policy if exists "Boards visible to team members"          on public.boards;
drop policy if exists "Team admins/members can manage boards"   on public.boards;

create policy "Boards visible to team members"
  on public.boards for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins/members can insert boards"
  on public.boards for insert
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins/members can update boards"
  on public.boards for update
  using  (public.is_team_admin_or_member(team_id))
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins can delete boards"
  on public.boards for delete
  using (public.is_team_admin(team_id));

-- ============================================================
-- COLUMNS
-- ============================================================
drop policy if exists "Columns visible to board's team members"    on public.columns;
drop policy if exists "Team admins/members can manage columns"      on public.columns;

create policy "Columns visible to board's team members"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.team_id = any(public.get_my_team_ids())
    )
  );

create policy "Team admins/members can insert columns"
  on public.columns for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and public.is_team_admin_or_member(boards.team_id)
    )
  );

create policy "Team admins/members can update columns"
  on public.columns for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and public.is_team_admin_or_member(boards.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and public.is_team_admin_or_member(boards.team_id)
    )
  );

create policy "Team admins can delete columns"
  on public.columns for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and public.is_team_admin(boards.team_id)
    )
  );

-- ============================================================
-- LABELS
-- ============================================================
drop policy if exists "Labels visible to team members"           on public.labels;
drop policy if exists "Team admins/members can manage labels"    on public.labels;

create policy "Labels visible to team members"
  on public.labels for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins/members can insert labels"
  on public.labels for insert
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins/members can update labels"
  on public.labels for update
  using  (public.is_team_admin_or_member(team_id))
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins can delete labels"
  on public.labels for delete
  using (public.is_team_admin(team_id));

-- ============================================================
-- TASKS
-- ============================================================
drop policy if exists "Tasks visible to team members"           on public.tasks;
drop policy if exists "Team admins/members can manage tasks"    on public.tasks;

create policy "Tasks visible to team members"
  on public.tasks for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins/members can insert tasks"
  on public.tasks for insert
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins/members can update tasks"
  on public.tasks for update
  using  (public.is_team_admin_or_member(team_id))
  with check (public.is_team_admin_or_member(team_id));

create policy "Team admins/members can delete tasks"
  on public.tasks for delete
  using (public.is_team_admin_or_member(team_id));

-- ============================================================
-- TASK ASSIGNEES
-- ============================================================
-- Extra check: the assignee (user_id) must also be a team member

drop policy if exists "Task assignees visible to team members"            on public.task_assignees;
drop policy if exists "Team admins/members can manage task assignees"     on public.task_assignees;

create policy "Task assignees visible to team members"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

create policy "Team admins/members can insert task assignees"
  on public.task_assignees for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and public.is_team_admin_or_member(tasks.team_id)
        -- assignee must also be a member of the same team
        and public.is_team_member_by_id(tasks.team_id, task_assignees.user_id)
    )
  );

create policy "Team admins/members can delete task assignees"
  on public.task_assignees for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and public.is_team_admin_or_member(tasks.team_id)
    )
  );

-- ============================================================
-- TASK LABELS
-- ============================================================
drop policy if exists "Task labels visible to team members"          on public.task_labels;
drop policy if exists "Team admins/members can manage task labels"   on public.task_labels;

create policy "Task labels visible to team members"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

create policy "Team admins/members can insert task labels"
  on public.task_labels for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and public.is_team_admin_or_member(tasks.team_id)
    )
  );

create policy "Team admins/members can delete task labels"
  on public.task_labels for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and public.is_team_admin_or_member(tasks.team_id)
    )
  );

-- ============================================================
-- TASK ACTIVITY  (immutable log — no UPDATE or DELETE)
-- ============================================================
drop policy if exists "Task activity visible to team members" on public.task_activity;
drop policy if exists "Team members can insert activity"      on public.task_activity;

create policy "Task activity visible to team members"
  on public.task_activity for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_activity.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

-- Any team member (including viewers) can be an activity author (e.g. viewing a task generates activity)
-- but user_id must match the authenticated user to prevent spoofing
create policy "Team members can insert own activity"
  on public.task_activity for insert
  with check (
    user_id = auth.uid()
    AND exists (
      select 1 from public.tasks
      where tasks.id = task_activity.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

-- No UPDATE or DELETE policy — activity log is immutable by design

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
-- SELECT: all team members (need to see plan on billing page)
-- INSERT: team admin only (onboarding creates initial lite subscription)
-- UPDATE: team admin only (billing page plan changes; Stripe webhook uses service_role)
-- DELETE: no policy — service_role handles cancellations via webhook

drop policy if exists "Team members can view subscription"    on public.subscriptions;
drop policy if exists "Team admins can manage subscriptions"  on public.subscriptions;

create policy "Team members can view subscription"
  on public.subscriptions for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins can insert subscription"
  on public.subscriptions for insert
  with check (public.is_team_admin(team_id));

create policy "Team admins can update subscription"
  on public.subscriptions for update
  using  (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));
