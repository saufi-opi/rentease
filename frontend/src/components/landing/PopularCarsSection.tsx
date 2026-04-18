import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { Fuel, Loader2, Settings, Users } from "lucide-react"
import { VehicleControllerService } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

export function PopularCarsSection() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["popular-vehicles"],
    queryFn: () => VehicleControllerService.getPopularVehicles({ limit: 8 }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            POPULAR FOR RENTING
          </h2>
          <p className="text-muted-foreground">
            Most booked vehicles by our renters
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {vehicles.map((vehicle) => {
                const displayPrice =
                  vehicle.discounted_price ?? vehicle.rental_rate ?? 0
                return (
                  <motion.div key={vehicle.id} variants={cardVariants}>
                    <Card className="group overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                      <div className="aspect-4/3 overflow-hidden">
                        <img
                          src={
                            vehicle.image_url ||
                            "/assets/images/vehicles/placeholder.png"
                          }
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-foreground">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.year} · {vehicle.type}
                          </p>
                        </div>

                        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{vehicle.seats} seats</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            <span>{vehicle.fuelType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            <span>{vehicle.transmission}</span>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-primary mb-3">
                          RM {Number(displayPrice).toFixed(2)}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            / day
                          </span>
                        </p>

                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            size="sm"
                            className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90"
                            asChild
                          >
                            <Link
                              to="/vehicles/$id/book"
                              params={{ id: vehicle.id! }}
                            >
                              Book Now
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8 border-primary/20 text-primary hover:bg-primary/5"
                            asChild
                          >
                            <Link
                              to="/vehicles/$id"
                              params={{ id: vehicle.id! }}
                            >
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
