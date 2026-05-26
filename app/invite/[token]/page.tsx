import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { InviteAuthForms } from "./InviteAuthForms";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up invite (no auth required)
  const { data: invite } = (await supabase
    .from("team_invites")
    .select("id, team_id, email, role, expires_at, accepted_at, teams(name, slug)")
    .eq("token", token)
    .maybeSingle()) as {
    data: {
      id: string;
      team_id: string;
      email: string;
      role: string;
      expires_at: string;
      accepted_at: string | null;
      teams: { name: string; slug: string } | null;
    } | null;
    error: unknown;
  };
  console.log({ token });
  console.log(invite);
  if (!invite) {
    return (
      <InviteErrorCard
        title='Invalid invite'
        description='This invite link is invalid or has been revoked.'
      />
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <InviteErrorCard
        title='Invite expired'
        description='This invite link has expired. Ask your team admin to send a new one.'
      />
    );
  }

  if (invite.accepted_at) {
    redirect(`/${invite.teams?.slug ?? ""}`);
  }
  console.log(1111);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invite context shown in all states
  const inviteHeader = (
    <div className='mb-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm'>
      <p className='font-medium'>You&apos;ve been invited to join</p>
      <p className='mt-0.5 text-lg font-semibold'>{invite.teams?.name ?? "a team"}</p>
      <p className='mt-1 text-muted-foreground'>
        Invite sent to <span className='font-medium text-foreground'>{invite.email}</span>
      </p>
    </div>
  );

  // Not logged in — show signup/login forms
  if (!user) {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Accept your invitation</CardTitle>
          <CardDescription>Create an account or sign in to join the team</CardDescription>
        </CardHeader>
        <CardContent>
          {inviteHeader}
          <InviteAuthForms inviteEmail={invite.email} next={`/invite/${token}`} />
        </CardContent>
      </Card>
    );
  }
  console.log(2222);
  // Wrong user — logged in as someone else
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>This invite was sent to a different email address</CardDescription>
        </CardHeader>
        <CardContent>
          {inviteHeader}
          <div className='mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
            You&apos;re signed in as <strong>{user.email}</strong>, but this invite is for{" "}
            <strong>{invite.email}</strong>.
          </div>
          <div className='flex flex-col gap-2'>
            <form action={logout}>
              <Button type='submit' variant='outline' className='w-full'>
                Sign out and use correct account
              </Button>
            </form>
            <Link
              href='/'
              className='text-center text-sm text-muted-foreground hover:text-foreground'>
              Go to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Correct user — accept invite and redirect
  const { error: memberError } = await supabase.from("team_members").upsert(
    {
      team_id: invite.team_id,
      user_id: user.id,
      role: invite.role as "admin" | "member" | "viewer",
    },
    { onConflict: "team_id,user_id", ignoreDuplicates: true },
  );
  if (memberError) console.error("[invite] team_members upsert error:", memberError);

  const { error: inviteError } = await supabase
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (inviteError) console.error("[invite] team_invites update error:", inviteError);

  redirect(`/${invite.teams?.slug ?? ""}`);
}

function InviteErrorCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href='/login'>
          <Button className='w-full'>Go to login</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
