import { createFileRoute, Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Heart, Star, Settings2, Fuel, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/favourites")({
  component: FavouritesPage,
})

// Mock data based on the cars array
const favoriteVehicles = [
  { id: 1, name: "BMW M3 Sport", type: "Car", rating: 4.5, transmission: "Automatic", fuel: "Petrol", seats: 5, price: 999, image: "/assets/images/vehicles/grey_sport.png" },
  { id: 4, name: "Porsche 911 Turbo", type: "Car", rating: 4.9, transmission: "Automatic", fuel: "Petrol", seats: 4, price: 1899, image: "/assets/images/vehicles/silver_supercar.png" },
]

function FavouritesPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Favourites</h1>
        <p className="text-muted-foreground mt-2">
          Manage your saved vehicles for quick access later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {favoriteVehicles.length > 0 ? (
          favoriteVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all flex flex-col"
            >
              <div className="relative group">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm z-10"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
                <div className="absolute bottom-3 left-3 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg z-10">
                  {vehicle.type === "Car" ? <Settings2 className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </div>
                {/* Subtle gradient overlay for better image contrast */}
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-foreground">{vehicle.name}</h3>
                  <div className="flex items-center gap-1 bg-accent/50 px-2 py-1 rounded-md">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold">{vehicle.rating}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 bg-muted/30 p-3 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-primary" />
                    {vehicle.transmission}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-primary" />
                    {vehicle.fuel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {vehicle.seats} {vehicle.type === "Car" ? "Seats" : "Person"}
                  </span>
                </div>
                
                <div className="mt-auto">
                  <div className="flex flex-col mb-5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price Starting From</span>
                    <p className="text-primary font-bold text-xl">RM {vehicle.price} <span className="text-xs font-normal text-muted-foreground">/ Day</span></p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-primary/20 text-primary hover:bg-primary/10 transition-colors" asChild>
                      <Link to={`/cars/${vehicle.id}` as any}>Details</Link>
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" asChild>
                      <Link to={`/cars/${vehicle.id}/book` as any}>Book Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl border-border bg-muted/10">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <Heart className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No favourites yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              You haven't saved any vehicles to your favourites. Browse our cars and click the heart icon to save them here for quick access!
            </p>
            <Button className="mt-8 rounded-full px-8" asChild>
              <Link to="/vehicles">Browse Vehicles</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
