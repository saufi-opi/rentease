import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Fuel, Settings } from "lucide-react"

const popularCars = [
  {
    id: 1,
    name: "Toyota Camry",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&q=80",
    rating: 4.8,
    seats: 5,
    fuel: "Petrol",
    transmission: "Automatic",
    price: 2500,
  },
  {
    id: 2,
    name: "Honda City",
    image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&q=80",
    rating: 4.6,
    seats: 5,
    fuel: "Diesel",
    transmission: "Manual",
    price: 1800,
  },
  {
    id: 3,
    name: "Hyundai Creta",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80",
    rating: 4.7,
    seats: 5,
    fuel: "Petrol",
    transmission: "Automatic",
    price: 2200,
  },
  {
    id: 4,
    name: "Maruti Swift",
    image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80",
    rating: 4.5,
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    price: 1500,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function PopularCarsSection() {
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
          <h2 className="mb-2 text-3xl font-bold text-foreground">POPULAR FOR RENTING</h2>
          <p className="text-muted-foreground">Choose from our most popular rental cars</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {popularCars.map((car) => (
            <motion.div key={car.id} variants={cardVariants}>
              <Card className="group overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="aspect-4/3 overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={car.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{car.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">{car.rating}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{car.seats} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      <span>{car.fuel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      <span>{car.transmission}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">Rs {car.price}</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                    <Button size="sm" className="bg-primary text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
