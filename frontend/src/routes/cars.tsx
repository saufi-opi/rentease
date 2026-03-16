import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "@tanstack/react-router"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Search, Star, Heart, Fuel, Users, Settings2, ChevronLeft, ChevronRight } from "lucide-react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/cars")({
  component: CarsPage,
  head: () => ({
    meta: [
      {
        title: "Browse Cars - RentEase",
      },
    ],
  }),
})

const cars = [
  { id: 1, name: "BMW M3 Sport", rating: 4.5, transmission: "Automatic", fuel: "Petrol", seats: 5, price: 999, image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop" },
  { id: 2, name: "Audi RS5 Coupe", rating: 4.8, transmission: "Automatic", fuel: "Petrol", seats: 4, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop", price: 1299 },
  { id: 3, name: "Mercedes AMG GT", rating: 4.7, transmission: "Automatic", fuel: "Petrol", seats: 2, price: 1499, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop" },
  { id: 4, name: "Porsche 911 Turbo", rating: 4.9, transmission: "Automatic", fuel: "Petrol", seats: 4, price: 1899, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop" },
  { id: 5, name: "Toyota Supra GR", rating: 4.6, transmission: "Manual", fuel: "Petrol", seats: 2, price: 899, image: "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=400&h=300&fit=crop" },
  { id: 6, name: "Nissan GT-R", rating: 4.8, transmission: "Automatic", fuel: "Petrol", seats: 4, price: 1599, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop" },
  { id: 7, name: "Ford Mustang GT", rating: 4.5, transmission: "Manual", fuel: "Petrol", seats: 4, price: 799, image: "https://images.unsplash.com/photo-1584345604476-8ec5f82d661f?w=400&h=300&fit=crop" },
  { id: 8, name: "Chevrolet Camaro", rating: 4.4, transmission: "Automatic", fuel: "Petrol", seats: 4, price: 749, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop" },
  { id: 9, name: "Lamborghini Huracan", rating: 5.0, transmission: "Automatic", fuel: "Petrol", seats: 2, price: 2999, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop" },
]

const segments = ["Hatchback", "Sedan", "SUV", "MUV"]
const brands = ["Maruti", "Hyundai", "Mahindra", "Honda", "Toyota"]
const fuelTypes = ["Diesel", "Petrol"]
const transmissionTypes = ["Automatic", "Manual"]
const seatingCapacity = ["5 Seats", "7 Seats"]

function CarsPage() {
  const [favorites, setFavorites] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      
      {/* Search Bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-background min-w-[200px]">
              <MapPin className="h-5 w-5 text-primary" />
              <Select defaultValue="location">
                <SelectTrigger className="border-0 shadow-none p-0 h-auto focus:ring-0 bg-transparent">
                  <SelectValue placeholder="Starting Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Starting Location</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-background min-w-[280px]">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start Date - End Date</span>
            </div>
            <Button className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-64 shrink-0"
          >
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Filters</h2>
                <Button variant="link" className="text-primary p-0 h-auto text-sm">
                  RESET ALL
                </Button>
              </div>

              {/* Segment */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Segment</h3>
                <div className="space-y-2">
                  {segments.map(segment => (
                    <label key={segment} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox id={segment} />
                      <span className="text-sm text-muted-foreground">{segment}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Brand</h3>
                <div className="space-y-2">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox id={brand} />
                      <span className="text-sm text-muted-foreground">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fuel Type */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Fuel Type</h3>
                <div className="flex flex-wrap gap-2">
                  {fuelTypes.map(fuel => (
                    <Button key={fuel} variant="outline" size="sm" className="rounded-full text-xs">
                      {fuel}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Transmission Type */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Transmission Type</h3>
                <div className="flex flex-wrap gap-2">
                  {transmissionTypes.map(type => (
                    <Button key={type} variant="outline" size="sm" className="rounded-full text-xs">
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Car Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">{cars.length} cars available</p>
              <Select defaultValue="recommended">
                <SelectTrigger className="w-[150px] bg-transparent">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {cars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative group">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
                    >
                      <Heart 
                        className={`h-5 w-5 ${favorites.includes(car.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                      />
                    </button>
                    <div className="absolute bottom-3 left-3 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Settings2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{car.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{car.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Settings2 className="h-3 w-3" />
                        {car.transmission}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        {car.fuel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {car.seats} Seats
                      </span>
                    </div>
                    <div className="flex flex-col mb-5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price Starting From</span>
                      <p className="text-primary font-bold text-lg">₹ {car.price} <span className="text-xs font-normal text-muted-foreground">/ Day</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-primary/20 text-primary hover:bg-primary/5 transition-colors" asChild>
                        <Link to={`/cars/${car.id}`}>Details</Link>
                      </Button>
                      <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" asChild>
                        <Link to={`/cars/${car.id}/book`}>Book Now</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button variant="outline" size="icon" disabled className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[1, 2, 3, '...', 10].map((page, i) => (
                <Button
                  key={i}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="rounded-full w-10 h-10"
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
