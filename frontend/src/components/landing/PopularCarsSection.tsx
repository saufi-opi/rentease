import { useState } from "react"
import { motion, Variants, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Fuel, Settings, Bike, Car } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const popularVehicles = {
  cars: [
    {
      id: 1,
      name: "Toyota Camry",
      image: "/assets/images/vehicles/silver_sedan.png",
      rating: 4.8,
      seats: 5,
      fuel: "Petrol",
      transmission: "Automatic",
      price: 250,
    },
    {
      id: 2,
      name: "Honda City",
      image: "/assets/images/vehicles/silver_sedan.png",
      rating: 4.6,
      seats: 5,
      fuel: "Diesel",
      transmission: "Manual",
      price: 180,
    },
    {
      id: 3,
      name: "Hyundai Creta",
      image: "/assets/images/vehicles/white_suv.png",
      rating: 4.7,
      seats: 5,
      fuel: "Petrol",
      transmission: "Automatic",
      price: 220,
    },
    {
      id: 4,
      name: "Perodua Myvi",
      image: "/assets/images/vehicles/white_compact.png",
      rating: 4.5,
      seats: 5,
      fuel: "Petrol",
      transmission: "Automatic",
      price: 120,
    },
  ],
  bikes: [
    {
      id: 101,
      name: "Yamaha Y15ZR",
      image: "/assets/images/vehicles/grey_moped.png",
      rating: 4.7,
      seats: 2,
      fuel: "Petrol",
      transmission: "Manual",
      price: 50,
    },
    {
      id: 102,
      name: "Honda RS150R",
      image: "/assets/images/vehicles/grey_moped.png",
      rating: 4.6,
      seats: 2,
      fuel: "Petrol",
      transmission: "Manual",
      price: 45,
    },
    {
      id: 103,
      name: "Kawasaki Ninja 250",
      image: "/assets/images/vehicles/silver_sportbike.png",
      rating: 4.9,
      seats: 2,
      fuel: "Petrol",
      transmission: "Manual",
      price: 120,
    },
    {
      id: 104,
      name: "Vespa Primavera",
      image: "/assets/images/vehicles/white_scooter.png",
      rating: 4.8,
      seats: 2,
      fuel: "Petrol",
      transmission: "Automatic",
      price: 80,
    },
  ]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

export function PopularCarsSection() {
  const [activeTab, setActiveTab] = useState<"cars" | "bikes">("cars")
  const data = activeTab === "cars" ? popularVehicles.cars : popularVehicles.bikes

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
          <p className="text-muted-foreground">Choose from our most popular rental vehicles</p>
          
          <div className="mt-8 flex justify-center">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as "cars" | "bikes")}
              className="w-full max-w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="cars" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Car className="h-4 w-4" />
                  Car
                </TabsTrigger>
                <TabsTrigger value="bikes" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Bike className="h-4 w-4" />
                  Bike
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {data.map((vehicle) => (
              <motion.div key={vehicle.id} variants={cardVariants}>
                <Card className="group overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="aspect-4/3 overflow-hidden">
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{vehicle.rating}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{vehicle.seats} seats</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        <span>{vehicle.fuel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        <span>{vehicle.transmission}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary">RM {vehicle.price}</span>
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
        </AnimatePresence>
      </div>
    </section>
  )
}
