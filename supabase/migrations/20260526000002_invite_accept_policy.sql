-- Allow the invited user to mark their own invite as accepted.
-- The existing "Team admins can manage invites" ALL policy requires team membership,
-- but the invited user is not yet in team_members when they accept.
-- This explicit UPDATE policy lets them mark it accepted by matching their email.
create policy "Invited user can accept invite"
  on public.team_invites for update
  using (lower(email) = lower(auth.email()))
  with check (lower(email) = lower(auth.email()));
