import { createFileRoute } from "@tanstack/react-router"
import { AppHeader } from "@/components/Layout/AppHeader"
import { FAQSection } from "@/components/landing/FAQSection"
import { HeroSection } from "@/components/landing/HeroSection"
import { HowWeWorkSection } from "@/components/landing/HowWeWorkSection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { PopularCarsSection } from "@/components/landing/PopularCarsSection"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { TrendingOffersSection } from "@/components/landing/TrendingOffersSection"
import { WhyChooseUsSection } from "@/components/landing/WhyChooseUsSection"

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
      <HowWeWorkSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <FAQSection />
      <LandingFooter />
    </main>
  )
}
