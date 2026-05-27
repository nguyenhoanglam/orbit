'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup, type AuthState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {})

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start managing projects with your team</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.message && (
            <p className={`rounded-md px-3 py-2 text-sm ${state.success ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
              {state.message}
            </p>
          )}
          {!state.success && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Full name</Label>
                <Input id="displayName" name="displayName" placeholder="Jane Smith" required />
                <FieldError errors={state.errors?.displayName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                <FieldError errors={state.errors?.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Min. 8 characters" required />
                <FieldError errors={state.errors?.password} />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Creating account…' : 'Create account'}
              </Button>
            </>
          )}
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
