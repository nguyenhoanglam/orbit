'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, loginWithMagicLink, type AuthState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

function PasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {})

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email-pw">Email</Label>
        <Input id="email-pw" name="email" type="email" placeholder="you@example.com" required />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
        <FieldError errors={state.errors?.password} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function MagicLinkForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginWithMagicLink, {})

  if (state.success) {
    return (
      <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
        {state.message}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email-magic">Email</Label>
        <Input id="email-magic" name="email" type="email" placeholder="you@example.com" required />
        <FieldError errors={state.errors?.email} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send magic link'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Orbit account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
            <TabsTrigger value="magic" className="flex-1">Magic link</TabsTrigger>
          </TabsList>
          <TabsContent value="password">
            <PasswordForm />
          </TabsContent>
          <TabsContent value="magic">
            <MagicLinkForm />
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
