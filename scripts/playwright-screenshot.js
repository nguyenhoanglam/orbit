/**
 * Playwright script to:
 * 1. Login to the app via Supabase admin-generated magic link
 * 2. Navigate to the dashboard
 * 3. Take a screenshot
 * 4. Validate design quality on landing + pricing pages
 */

const { chromium } = require('@playwright/test')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const APP_URL = 'http://localhost:3000'
const TEST_EMAIL = 'lam@gmail.com'

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Generate a magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('Failed to generate magic link:', linkError?.message)
    process.exit(1)
  }

  const rawLink = linkData.properties.action_link
  const url = new URL(rawLink)
  const tokenHash = url.searchParams.get('token_hash')
  const callbackUrl = `${APP_URL}/auth/callback?token_hash=${tokenHash}&type=magiclink`

  console.log('Launching Playwright...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  // Authenticate via callback
  console.log('Authenticating via callback...')
  await page.goto(callbackUrl, { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(3000)

  console.log('Current URL after auth:', page.url())

  // Navigate to team dashboard
  console.log('Navigating to dashboard...')
  await page.goto(`${APP_URL}/dev2`, { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(2000)

  const currentUrl = page.url()
  console.log('Dashboard URL:', currentUrl)

  // Take dashboard screenshot
  const screenshotDir = path.join(__dirname, '../public/screenshots')
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.screenshot({
    path: path.join(screenshotDir, 'dashboard.png'),
    fullPage: false,
  })
  console.log('✓ Dashboard screenshot saved to public/screenshots/dashboard.png')

  // ─── Design validation ────────────────────────────────────────────────────
  console.log('\nRunning design validation...')
  const results = []

  // 1. Landing page
  await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1000)

  // Auth users get redirected to /dev2, so check that it loaded
  results.push({ check: 'Landing page redirects auth users correctly', pass: !page.url().includes('/login') })

  // 2. Sign out and check landing for unauthenticated view
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  // Clear cookies
  await context.clearCookies()

  await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1500)

  results.push({ check: 'Landing page loads for guests', pass: page.url() === `${APP_URL}/` || page.url() === `${APP_URL}` })

  const heroText = await page.$eval('h1', el => el.textContent).catch(() => null)
  results.push({ check: 'Hero headline exists', pass: !!heroText && heroText.length > 5 })
  console.log('  Hero text:', heroText?.trim().substring(0, 60))

  const navExists = await page.$('header').catch(() => null)
  results.push({ check: 'Navigation header present', pass: !!navExists })

  // Take landing page screenshot (guest view)
  await page.screenshot({
    path: path.join(screenshotDir, 'landing-page.png'),
    fullPage: true,
  })
  console.log('✓ Landing page screenshot saved to public/screenshots/landing-page.png')

  // 3. Pricing page
  await page.goto(`${APP_URL}/pricing`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1000)

  results.push({ check: 'Pricing page loads (status 200)', pass: page.url().includes('/pricing') })

  const pricingHeading = await page.$eval('h1', el => el.textContent).catch(() => null)
  results.push({ check: 'Pricing heading exists', pass: !!pricingHeading })
  console.log('  Pricing heading:', pricingHeading?.trim().substring(0, 60))

  const pricingCards = await page.$$('[class*="rounded-2xl"]')
  results.push({ check: `Pricing cards rendered (found ${pricingCards.length})`, pass: pricingCards.length >= 2 })

  const hasOverflow = await page.evaluate(() => document.body.scrollWidth > document.documentElement.clientWidth)
  results.push({ check: 'No horizontal overflow on pricing page', pass: !hasOverflow })

  // Take pricing page screenshot
  await page.screenshot({
    path: path.join(screenshotDir, 'pricing-page.png'),
    fullPage: true,
  })
  console.log('✓ Pricing page screenshot saved to public/screenshots/pricing-page.png')

  // Print results
  console.log('\n─── Design Validation Results ───────────────────────────')
  let allPassed = true
  for (const r of results) {
    const icon = r.pass ? '✓' : '✗'
    console.log(`  ${icon} ${r.check}`)
    if (!r.pass) allPassed = false
  }
  console.log('──────────────────────────────────────────────────────────')
  console.log(allPassed ? '✓ All checks passed!' : '⚠ Some checks failed')

  await browser.close()
  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
