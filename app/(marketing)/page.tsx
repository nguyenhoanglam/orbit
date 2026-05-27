import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/marketing/HeroSection'
import { ScreenshotSection } from '@/components/marketing/ScreenshotSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { PricingSection } from '@/components/marketing/PricingSection'

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  // Supabase may land the PKCE code here if emailRedirectTo was not set
  // correctly — forward it to the proper callback handler.
  const { code } = await searchParams
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: members } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)

    const teamId = (members as Array<{ team_id: string }> | null)?.[0]?.team_id

    if (!teamId) redirect('/onboarding')

    const { data: teams } = await supabase
      .from('teams')
      .select('slug')
      .eq('id', teamId)
      .limit(1)

    const teamSlug = (teams as Array<{ slug: string }> | null)?.[0]?.slug

    if (teamSlug) redirect(`/${teamSlug}`)

    redirect('/onboarding')
  }

  return (
    <>
      <HeroSection />
      <ScreenshotSection />
      <FeaturesSection />
      <PricingSection />
    </>
  )
}
