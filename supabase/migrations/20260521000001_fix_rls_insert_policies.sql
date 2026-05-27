-- Fix missing INSERT policies needed for onboarding team creation

-- Any authenticated user can create a new team (they must set themselves as created_by)
create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (created_by = auth.uid());

-- Users can add themselves to a team (onboarding + invite acceptance)
create policy "Users can insert themselves into teams"
  on public.team_members for insert
  with check (user_id = auth.uid());

-- Team admins can add other members (invite flow managed by admin)
create policy "Team admins can insert team members"
  on public.team_members for insert
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

-- Team admins can manage (update/delete) members
create policy "Team admins can manage team members"
  on public.team_members for update
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

create policy "Team admins can remove team members"
  on public.team_members for delete
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

-- Team admins can insert/update subscriptions (onboarding creates a Lite subscription)
create policy "Team admins can manage subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.team_members
      where team_id = subscriptions.team_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.team_members
      where team_id = subscriptions.team_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );
