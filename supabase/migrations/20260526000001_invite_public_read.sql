-- Allow anyone (including unauthenticated users) to read a team invite by token.
-- This is required so the invite acceptance page can show invite details before login.
create policy "Anyone can read invite by token"
  on public.team_invites for select
  using (true);
