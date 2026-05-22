-- Allow team creators to see their own team even before being added as a member.
-- This is needed because INSERT ... RETURNING triggers the SELECT policy:
-- when onboarding inserts a team, the creator isn't in team_members yet,
-- so the previous "id = ANY(get_my_team_ids())" check blocked the RETURNING clause.

drop policy if exists "Teams visible to members" on public.teams;

create policy "Teams visible to members"
  on public.teams for select
  using (
    id = any(public.get_my_team_ids())
    or created_by = auth.uid()
  );
