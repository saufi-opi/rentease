import { createFileRoute } from "@tanstack/react-router"
import { AppHeader } from "@/components/Layout/AppHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { PopularCarsSection } from "@/components/landing/PopularCarsSection"
import { TrendingOffersSection } from "@/components/landing/TrendingOffersSection"
import { ReferFriendSection } from "@/components/landing/ReferFriendSection"
import { HowWeWorkSection } from "@/components/landing/HowWeWorkSection"
import { WhyChooseUsSection } from "@/components/landing/WhyChooseUsSection"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { FAQSection } from "@/components/landing/FAQSection"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: "RentEase - Discover Freedom on Wheels",
      },
    ],
  }),
})

function LandingPage() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <HeroSection />
      <PopularCarsSection />
      <TrendingOffersSection />
      <ReferFriendSection />
      <HowWeWorkSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <FAQSection />
      <LandingFooter />
    </main>
  )
}
