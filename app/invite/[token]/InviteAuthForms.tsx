'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { login, signup, type AuthState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

interface Props {
  inviteEmail: string
  next: string
}

function SignupForm({ inviteEmail, next }: Props) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Full name</Label>
        <Input id="displayName" name="displayName" placeholder="Jane Smith" required />
        <FieldError errors={state.errors?.displayName} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup"
          name="email"
          type="email"
          defaultValue={inviteEmail}
          placeholder="you@example.com"
          required
        />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password-signup">Password</Label>
        <Input
          id="password-signup"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
        />
        <FieldError errors={state.errors?.password} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account...' : 'Create account & accept invite'}
      </Button>
    </form>
  )
}

function LoginForm({ inviteEmail, next }: Props) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email-login">Email</Label>
        <Input
          id="email-login"
          name="email"
          type="email"
          defaultValue={inviteEmail}
          placeholder="you@example.com"
          required
        />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password-login">Password</Label>
        <Input
          id="password-login"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
        <FieldError errors={state.errors?.password} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in & accept invite'}
      </Button>
    </form>
  )
}

export function InviteAuthForms({ inviteEmail, next }: Props) {
  return (
    <Tabs defaultValue="signup">
      <TabsList className="mb-4 w-full">
        <TabsTrigger value="signup" className="flex-1">Create account</TabsTrigger>
        <TabsTrigger value="login" className="flex-1">Sign in</TabsTrigger>
      </TabsList>
      <TabsContent value="signup">
        <SignupForm inviteEmail={inviteEmail} next={next} />
      </TabsContent>
      <TabsContent value="login">
        <LoginForm inviteEmail={inviteEmail} next={next} />
      </TabsContent>
    </Tabs>
  )
}
