import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"

export function HeroSection() {
  const navigate = useNavigate()
  const [pickupDate, setPickupDate] = useState<Date | undefined>()
  const [dropoffDate, setDropoffDate] = useState<Date | undefined>()

  const handleDateSelect = ({
    from,
    to,
  }: {
    from: Date | undefined
    to: Date | undefined
  }) => {
    setPickupDate(from)
    setDropoffDate(to)
  }

  const handleSearch = () => {
    navigate({
      to: "/vehicles",
      search: {
        pickup: pickupDate ? format(pickupDate, "yyyy-MM-dd") : undefined,
        return: dropoffDate ? format(dropoffDate, "yyyy-MM-dd") : undefined,
      },
    })
  }

  return (
    <section className="relative min-h-[700px] overflow-hidden bg-foreground">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full leading-0 transform rotate-180">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-[100px] text-background fill-current"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </div>

      <div className="container relative mx-auto px-4 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center text-primary-foreground"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            >
              DISCOVER FREEDOM
              <br />
              ON WHEELS.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8 max-w-md text-lg opacity-90"
            >
              Let&apos;s find a vehicle that fits your needs. Compare prices
              from top vehicle rental companies.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button
                size="lg"
                variant="outline"
                onClick={handleSearch}
                className="w-fit border-primary-foreground bg-transparent text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary-foreground hover:text-primary"
              >
                Browse Vehicles
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Vehicle images grid */}
          <div className="hidden grid-cols-2 gap-4 lg:grid">
            {[
              {
                src: "/assets/images/marketing/offer_suv.png",
                alt: "Adventure SUV",
                delay: 0.3,
              },
              {
                src: "/assets/images/vehicles/silver_sportbike.png",
                alt: "Motorcycle",
                delay: 0.4,
              },
              {
                src: "/assets/images/marketing/hero_bg.png",
                alt: "Premium super car",
                delay: 0.5,
              },
              {
                src: "/assets/images/marketing/offer_weekend.png",
                alt: "Road trip SUV",
                delay: 0.6,
              },
            ].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: image.delay }}
                whileHover={{ scale: 1.05 }}
                className="overflow-hidden rounded-lg"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-48 w-full object-cover transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 rounded-xl bg-background p-6 shadow-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Find Your Perfect Ride
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                Pickup &amp; Return Dates
              </p>
              <DateRangePicker
                from={pickupDate}
                to={dropoffDate}
                onSelect={handleDateSelect}
                placeholder="Choose your dates"
                numberOfMonths={2}
                align="start"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-10 px-6 bg-primary text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-lg shrink-0"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
