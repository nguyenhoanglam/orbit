-- Fix infinite recursion in RLS policies.
--
-- Root cause: the "Team members visible to own team" policy on team_members
-- references team_members in its own USING clause, causing infinite recursion
-- whenever any other policy queries team_members to check membership.
--
-- Fix: create a security definer helper function that bypasses RLS to look up
-- the current user's team IDs. All membership-checking policies use this
-- function instead of a subquery on team_members.

-- 1. Security definer helper function (bypasses RLS — no recursion)
--    Returns uuid[] so it can be used with = ANY(...) in policy expressions.
create or replace function public.get_my_team_ids()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(team_id), array[]::uuid[])
  from public.team_members
  where user_id = auth.uid()
$$;

-- 2. Drop the recursive policy and replace it
drop policy if exists "Team members visible to own team" on public.team_members;

create policy "Team members visible to own team"
  on public.team_members for select
  using (team_id = any(public.get_my_team_ids()));

-- 3. Recreate all other policies that used team_members subqueries,
--    replacing them with get_my_team_ids() to avoid recursion.

-- teams
drop policy if exists "Teams visible to members" on public.teams;
create policy "Teams visible to members"
  on public.teams for select
  using (id = any(public.get_my_team_ids()));

drop policy if exists "Team admins can update team" on public.teams;
create policy "Team admins can update team"
  on public.teams for update
  using (
    exists (
      select 1 from public.team_members
      where team_id = teams.id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- team_invites
drop policy if exists "Team admins can manage invites" on public.team_invites;
create policy "Team admins can manage invites"
  on public.team_invites for all
  using (team_id = any(public.get_my_team_ids()));

-- workspaces
drop policy if exists "Workspace visible to team members" on public.workspaces;
create policy "Workspace visible to team members"
  on public.workspaces for select
  using (team_id = any(public.get_my_team_ids()));

drop policy if exists "Team admins/members can manage workspaces" on public.workspaces;
create policy "Team admins/members can manage workspaces"
  on public.workspaces for all
  using (team_id = any(public.get_my_team_ids()));

-- boards
drop policy if exists "Boards visible to team members" on public.boards;
create policy "Boards visible to team members"
  on public.boards for select
  using (team_id = any(public.get_my_team_ids()));

drop policy if exists "Team admins/members can manage boards" on public.boards;
create policy "Team admins/members can manage boards"
  on public.boards for all
  using (team_id = any(public.get_my_team_ids()));

-- columns
drop policy if exists "Columns visible to board's team members" on public.columns;
create policy "Columns visible to board's team members"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.team_id = any(public.get_my_team_ids())
    )
  );

drop policy if exists "Team admins/members can manage columns" on public.columns;
create policy "Team admins/members can manage columns"
  on public.columns for all
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.team_id = any(public.get_my_team_ids())
    )
  );

-- labels
drop policy if exists "Labels visible to team members" on public.labels;
create policy "Labels visible to team members"
  on public.labels for select
  using (team_id = any(public.get_my_team_ids()));

drop policy if exists "Team admins/members can manage labels" on public.labels;
create policy "Team admins/members can manage labels"
  on public.labels for all
  using (team_id = any(public.get_my_team_ids()));

-- tasks
drop policy if exists "Tasks visible to team members" on public.tasks;
create policy "Tasks visible to team members"
  on public.tasks for select
  using (team_id = any(public.get_my_team_ids()));

drop policy if exists "Team admins/members can manage tasks" on public.tasks;
create policy "Team admins/members can manage tasks"
  on public.tasks for all
  using (team_id = any(public.get_my_team_ids()));

-- task_assignees
drop policy if exists "Task assignees visible to team members" on public.task_assignees;
create policy "Task assignees visible to team members"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

drop policy if exists "Team admins/members can manage task assignees" on public.task_assignees;
create policy "Team admins/members can manage task assignees"
  on public.task_assignees for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

-- task_labels
drop policy if exists "Task labels visible to team members" on public.task_labels;
create policy "Task labels visible to team members"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

drop policy if exists "Team admins/members can manage task labels" on public.task_labels;
create policy "Team admins/members can manage task labels"
  on public.task_labels for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

-- task_activity
drop policy if exists "Task activity visible to team members" on public.task_activity;
create policy "Task activity visible to team members"
  on public.task_activity for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_activity.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

drop policy if exists "Team members can insert activity" on public.task_activity;
create policy "Team members can insert activity"
  on public.task_activity for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_activity.task_id
        and tasks.team_id = any(public.get_my_team_ids())
    )
  );

-- subscriptions
drop policy if exists "Team admins can view subscription" on public.subscriptions;
drop policy if exists "Team admins can manage subscriptions" on public.subscriptions;
create policy "Team members can view subscription"
  on public.subscriptions for select
  using (team_id = any(public.get_my_team_ids()));

create policy "Team admins can manage subscriptions"
  on public.subscriptions for all
  using (team_id = any(public.get_my_team_ids()));
