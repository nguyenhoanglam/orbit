import { MarketingNav } from '@/components/marketing/MarketingNav'
import { FooterSection } from '@/components/marketing/FooterSection'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090B]">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <FooterSection />
    </div>
  )
}
