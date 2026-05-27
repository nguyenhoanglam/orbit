interface InviteEmailProps {
  inviterName: string
  teamName: string
  inviteUrl: string
}

export function InviteEmail({ inviterName, teamName, inviteUrl }: InviteEmailProps) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#09090b', color: '#fafafa', padding: '40px 20px', margin: 0 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            You&apos;re invited to join Orbit 🚀
          </h1>
          <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '24px' }}>
            <strong style={{ color: '#fafafa' }}>{inviterName}</strong> has invited you to join{' '}
            <strong style={{ color: '#fafafa' }}>{teamName}</strong>.
          </p>
          <a
            href={inviteUrl}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#fafafa',
              color: '#09090b',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              marginBottom: '24px',
            }}
          >
            Accept invitation
          </a>
          <p style={{ fontSize: '12px', color: '#52525b' }}>
            This invite expires in 7 days. If you weren&apos;t expecting this, you can ignore this email.
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: '32px 0' }} />
          <p style={{ fontSize: '12px', color: '#52525b' }}>
            Or copy this link: {inviteUrl}
          </p>
        </div>
      </body>
    </html>
  )
}
