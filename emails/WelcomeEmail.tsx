interface WelcomeEmailProps {
  displayName: string
  teamName: string
}

export function WelcomeEmail({ displayName, teamName }: WelcomeEmailProps) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#09090b', color: '#fafafa', padding: '40px 20px', margin: 0 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Welcome to Orbit 👋
          </h1>
          <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '24px' }}>
            Hi {displayName}, your team <strong style={{ color: '#fafafa' }}>{teamName}</strong> is ready.
          </p>
          <p style={{ fontSize: '14px', color: '#71717a' }}>
            Start by creating a board and inviting your teammates.
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: '32px 0' }} />
          <p style={{ fontSize: '12px', color: '#52525b' }}>
            You received this email because you signed up for Orbit.
          </p>
        </div>
      </body>
    </html>
  )
}
