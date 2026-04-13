import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Bluetooth,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Fuel,
  Heart,
  Loader2,
  MapPin,
  Music,
  Settings2,
  ShieldCheck,
  Star,
  Usb,
  Users,
  Wind,
} from "lucide-react"
import { useState } from "react"
import { VehicleControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/vehicles/$id/")({
  component: VehicleDetailsPage,
})

function VehicleDetailsPage() {
  const { id } = Route.useParams()
  const [isFavorite, setIsFavorite] = useState(false)

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => VehicleControllerService.getVehicle({ id }),
    refetchInterval: 60 * 1000,
  })

  const { data: recommendedData } = useQuery({
    queryKey: ["vehicles-recommended"],
    queryFn: () => VehicleControllerService.browseVehicles({ size: 4 }),
  })

  const recommendations =
    recommendedData?.content?.filter((v) => v.id !== id).slice(0, 4) || []

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <LandingFooter />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Car className="h-20 w-20 text-muted-foreground mb-4 opacity-20" />
          <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            The vehicle you're looking for might have been removed or is
            temporarily unavailable.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to="/vehicles">Back to Fleet</Link>
          </Button>
        </div>
        <LandingFooter />
      </div>
    )
  }

  const mainImage =
    vehicle.image_url || "/assets/images/vehicles/placeholder.png"

  const features =
    vehicle.features && vehicle.features.length > 0
      ? vehicle.features.map((f) => ({
          icon: getFeatureIcon(f),
          label: f.replace(/_/g, " "),
        }))
      : []

  const reviews = [
    {
      id: 1,
      name: "Alex Stanton",
      role: "CEO at Bukalapak",
      date: "21 July 2022",
      rating: 4,
      comment:
        "We are very happy with the service from the RENT-EASE App. Rent-Ease has a low price and also a large variety of cars with good and comfortable facilities. In addition, the service provided by the officers is also very friendly and very polite.",
    },
    {
      id: 2,
      name: "Skylar Dias",
      role: "CEO at Amazon",
      date: "20 July 2022",
      rating: 4,
      comment:
        "We are greatly helped by the services of the RENT-EASE Application. Rent-Ease has low prices and also a wide variety of cars with good and comfortable facilities. In addition, the service provided by the officers is also very friendly and very polite.",
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ArrowRight className="h-3 w-3" />
          <Link to="/vehicles" className="hover:text-primary transition-colors">
            Vehicles
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="text-foreground font-medium">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-12 xl:col-span-7 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video bg-card rounded-2xl overflow-hidden shadow-xl border border-border group"
            >
              <img
                src={mainImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 right-4 p-3 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all hover:scale-110"
              >
                <Heart
                  className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                />
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-6 sm:p-8 rounded-2xl shadow-lg border border-border h-full relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex flex-col mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  {Boolean(vehicle.discount && vehicle.discount > 0) && (
                    <div className="absolute top-4 right-4 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {vehicle.discount}% OFF
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground opacity-50"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      4.5 (640+ Reviews)
                    </span>

                  </div>
                </div>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {vehicle.description}
                </p>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Type
                      </p>
                      <p className="font-semibold">{vehicle.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Seating
                      </p>
                      <p className="font-semibold">{vehicle.seats} Person</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Transmission
                      </p>
                      <p className="font-semibold capitalize">
                        {vehicle.transmission?.toLowerCase() || "Manual"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Fuel className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Fuel
                      </p>
                      <p className="font-semibold">{vehicle.fuelType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border mb-8">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-primary">
                        RM {vehicle.discounted_price || vehicle.rental_rate}
                      </span>
                      <span className="text-muted-foreground">/ Day</span>
                    </div>
                    {vehicle.discount && vehicle.discount > 0 ? (
                      <p className="text-xs text-muted-foreground line-through decoration-red-500/50">
                        RM {vehicle.rental_rate}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    asChild
                  >
                    <Link to="/vehicles/$id/book" params={{ id: id }} search={{ pickup: "", return: "" }}>
                      Rent Now
                    </Link>
                  </Button>
                </div>

                {vehicle.features && vehicle.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                      Features
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {features.map((f, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="text-primary">{f.icon}</div>
                          <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-tight">
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold">Recent Reviews</h2>
            <Badge
              variant="secondary"
              className="rounded-full bg-primary text-primary-foreground px-3 py-1 font-bold"
            >
              10
            </Badge>
          </div>
          <div className="grid gap-6">
            {reviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card p-6 rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                      <img
                        src={`https://i.pravatar.cc/150?u=${rev.id}`}
                        alt={rev.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold">{rev.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {rev.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      {rev.date}
                    </p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground opacity-30"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </motion.div>
            ))}
            <div className="flex justify-center mt-4">
              <Button variant="ghost" className="gap-2 text-primary font-bold">
                View All Reviews <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {recommendations.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Recommended Vehicles</h2>
              <Button
                variant="link"
                className="text-primary font-bold p-0 h-auto"
                asChild
              >
                <Link to="/vehicles">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((v) => (
                <Link
                  key={v.id}
                  to="/vehicles/$id"
                  params={{ id: v.id! }}
                  className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={
                        v.image_url || "/assets/images/vehicles/placeholder.png"
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={`${v.brand} ${v.model}`}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold truncate">
                      {v.brand} {v.model}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 mb-3">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">4.8</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-primary font-bold">
                        RM {v.rental_rate}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          /day
                        </span>
                      </p>
                      <Button size="sm" className="rounded-lg h-8 px-4">
                        Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
          <div className="bg-card p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Clock className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Cancellation Policy
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Free cancellation up to 48 hours before the pickup time. Late
              cancellations may incur a fee of 50% of the booking amount.
            </p>
            <Button
              variant="link"
              className="text-primary p-0 h-auto text-xs mt-4"
            >
              View Full Policy <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Agreement Policy
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I hereby agree to the terms and conditions of the Lease Agreement
              with RentEase, including insurance coverage details, liability,
              and usage restrictions.
            </p>
            <Button
              variant="link"
              className="text-primary p-0 h-auto text-xs mt-4"
            >
              Read Agreement <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}



function getFeatureIcon(feature: string) {
  switch (feature.toUpperCase()) {
    case "AC":
      return <Wind className="h-5 w-5" />
    case "BLUETOOTH":
      return <Bluetooth className="h-5 w-5" />
    case "GPS":
      return <MapPin className="h-5 w-5" />
    case "USB_CHARGER":
      return <Usb className="h-5 w-5" />
    case "AIR_BAG":
      return <ShieldCheck className="h-5 w-5" />
    case "MUSIC_SYSTEM":
      return <Music className="h-5 w-5" />
    case "SUNROOF":
      return <Wind className="h-5 w-5" />
    default:
      return <CheckCircle2 className="h-5 w-5" />
  }
}
