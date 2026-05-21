import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface WelcomeEmailOptions {
  to: string
  displayName: string
  teamName: string
}

export async function sendWelcomeEmail(opts: WelcomeEmailOptions) {
  if (!resend) return // no-op in local dev without API key

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Orbit <noreply@orbit.app>',
    to: opts.to,
    subject: `Welcome to Orbit, ${opts.displayName}!`,
    react: WelcomeEmail(opts),
  })
}
