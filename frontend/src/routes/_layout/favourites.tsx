import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Car, Fuel, Heart, Loader2, Settings2, Sparkles, Users } from "lucide-react"
import { FavouriteControllerService, VehicleControllerService } from "@/client"
import type { VehicleResponse } from "@/client"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/favourites")({
  component: FavouritesPage,
})

function VehicleCard({
  vehicle,
  isFavourited,
  onToggle,
}: {
  vehicle: VehicleResponse
  isFavourited: boolean
  onToggle: (id: string) => void
}) {
  const displayPrice = vehicle.discounted_price ?? vehicle.rental_rate ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all flex flex-col"
    >
      <div className="relative group">
        <img
          src={vehicle.image_url || "/assets/images/vehicles/placeholder.png"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm z-10"
          onClick={() => vehicle.id && onToggle(vehicle.id)}
          aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${isFavourited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
        </button>
        <div className="absolute bottom-3 left-3 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg z-10">
          <Car className="h-4 w-4" />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-foreground mb-1">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {vehicle.year} · {vehicle.type}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 bg-muted/30 p-3 rounded-lg">
          <span className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            {vehicle.transmission ?? "Manual"}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 text-primary" />
            {vehicle.fuelType ?? "Petrol"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {vehicle.seats} Seats
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex flex-col mb-5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Price Starting From
            </span>
            <p className="text-primary font-bold text-xl">
              RM {Number(displayPrice).toFixed(2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ Day</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              asChild
            >
              <Link to="/vehicles/$id" params={{ id: vehicle.id! }}>Details</Link>
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              asChild
            >
              <Link to="/vehicles/$id/book" params={{ id: vehicle.id! }}>Book Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FavouritesPage() {
  const queryClient = useQueryClient()

  const { data: favourites = [], isLoading: loadingFavourites } = useQuery({
    queryKey: ["favourites"],
    queryFn: () => FavouriteControllerService.getFavourites(),
  })

  const { data: favouriteIds = [] } = useQuery({
    queryKey: ["favouriteIds"],
    queryFn: () => FavouriteControllerService.getFavouriteIds(),
  })

  const { data: popularVehicles = [], isLoading: loadingPopular } = useQuery({
    queryKey: ["popular-vehicles"],
    queryFn: () => VehicleControllerService.getPopularVehicles({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  })

  const { mutate: toggleFavourite } = useMutation({
    mutationFn: (vehicleId: string) =>
      FavouriteControllerService.toggle({ vehicleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] })
      queryClient.invalidateQueries({ queryKey: ["favouriteIds"] })
    },
  })

  const popularNotFavourited = popularVehicles.filter(
    (v) => !favouriteIds.includes(v.id ?? ""),
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* My Favourites */}
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Favourites</h1>
          <p className="text-muted-foreground mt-2">
            Manage your saved vehicles for quick access later.
          </p>
        </div>

        {loadingFavourites ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : favourites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favourites.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isFavourited={true}
                onToggle={toggleFavourite}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl border-border bg-muted/10">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <Heart className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No favourites yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Browse our fleet and click the heart icon on any vehicle to save it here.
            </p>
            <Button className="mt-8 rounded-full px-8" asChild>
              <Link to="/vehicles">Browse Vehicles</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Popular Vehicles */}
      {(loadingPopular || popularNotFavourited.length > 0) && (
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Popular Right Now</h2>
            </div>
            <p className="text-muted-foreground">
              Most booked vehicles by other renters — add them to your favourites.
            </p>
          </div>

          {loadingPopular ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {popularNotFavourited.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isFavourited={favouriteIds.includes(vehicle.id ?? "")}
                  onToggle={toggleFavourite}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
