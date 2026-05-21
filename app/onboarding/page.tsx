'use client'

import { useActionState, useState } from 'react'
import { createTeam, type OnboardingState } from '@/lib/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [displayName, setDisplayName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlug, setTeamSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  const [state, action, pending] = useActionState<OnboardingState, FormData>(createTeam, {})

  function handleTeamNameChange(value: string) {
    setTeamName(value)
    if (!slugEdited) setTeamSlug(slugify(value))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>What&apos;s your name?</CardTitle>
            <CardDescription>This is how you&apos;ll appear to teammates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              disabled={displayName.trim().length < 2}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Name your team</CardTitle>
            <CardDescription>You can change this later in settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="teamName">Team name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => handleTeamNameChange(e.target.value)}
                placeholder="Acme Inc."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teamSlug">URL slug</Label>
              <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                <span className="text-muted-foreground">orbit.app/</span>
                <input
                  id="teamSlug"
                  value={teamSlug}
                  onChange={(e) => { setSlugEdited(true); setTeamSlug(e.target.value) }}
                  className="flex-1 bg-transparent py-2 pl-0.5 outline-none placeholder:text-muted-foreground"
                  placeholder="acme-inc"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="flex-1"
                disabled={teamName.trim().length < 2 || teamSlug.trim().length < 2}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>You&apos;re all set!</CardTitle>
            <CardDescription>Review your details and create your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <input type="hidden" name="displayName" value={displayName} />
              <input type="hidden" name="teamName" value={teamName} />
              <input type="hidden" name="teamSlug" value={teamSlug} />

              <dl className="divide-y divide-border rounded-md border text-sm">
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Your name</dt>
                  <dd className="font-medium">{displayName}</dd>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Team</dt>
                  <dd className="font-medium">{teamName}</dd>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd className="font-medium text-muted-foreground">/{teamSlug}</dd>
                </div>
              </dl>

              {state.message && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.message}
                </p>
              )}
              {state.errors?.teamSlug && (
                <FieldError errors={state.errors.teamSlug} />
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? 'Creating…' : 'Create team'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
