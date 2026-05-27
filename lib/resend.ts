import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { InviteEmail } from '@/emails/InviteEmail'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Orbit <noreply@orbit.app>'

interface WelcomeEmailOptions {
  to: string
  displayName: string
  teamName: string
}

export async function sendWelcomeEmail(opts: WelcomeEmailOptions) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Welcome to Orbit, ${opts.displayName}!`,
    react: WelcomeEmail(opts),
  })
}

interface InviteEmailOptions {
  to: string
  inviterName: string
  teamName: string
  token: string
}

export async function sendInviteEmail(opts: InviteEmailOptions) {
  if (!resend) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${opts.token}`

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `${opts.inviterName} invited you to ${opts.teamName} on Orbit`,
    react: InviteEmail({ ...opts, inviteUrl }),
  })
}

