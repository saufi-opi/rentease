import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format, parseISO } from "date-fns"
import { motion } from "framer-motion"
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Heart,
  Loader2,
  Search,
  Settings2,
  Star,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { VehicleControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useDebounce } from "@/hooks/useDebounce"

export const Route = createFileRoute("/vehicles/")({
  validateSearch: (search: Record<string, unknown>): { pickup?: string; return?: string } => ({
    pickup: (search.pickup as string) || undefined,
    return: (search.return as string) || undefined,
  }),
  component: VehiclesPage,
  head: () => ({
    meta: [{ title: "Browse Vehicles - RentEase" }],
  }),
})

const vehicleTypes = ["Car", "Bike"]
const PRICE_MIN = 0
const PRICE_MAX = 1000

function VehiclesPage() {
  const search = Route.useSearch()

  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("recommended")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_MIN,
    PRICE_MAX,
  ])
  const [pickupDate, setPickupDate] = useState(search.pickup ?? "")
  const [returnDate, setReturnDate] = useState(search.return ?? "")

  const debouncedSearchInput = useDebounce(searchInput, 500)
  const debouncedPriceRange = useDebounce(priceRange, 400)

  useEffect(() => {
    setSearchQuery(debouncedSearchInput)
    setCurrentPage(1)
  }, [debouncedSearchInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  const priceFilterActive =
    debouncedPriceRange[0] > PRICE_MIN || debouncedPriceRange[1] < PRICE_MAX
  const dateFilterActive = !!(pickupDate && returnDate)

  const { data, isLoading } = useQuery({
    queryKey: [
      "vehicles",
      currentPage,
      selectedType,
      selectedBrand,
      sortBy,
      searchQuery,
      debouncedPriceRange,
      pickupDate,
      returnDate,
    ],
    queryFn: () =>
      VehicleControllerService.browseVehicles({
        page: currentPage - 1,
        size: 9,
        type: selectedType || undefined,
        brand: selectedBrand || undefined,
        sortBy: sortBy !== "recommended" ? sortBy : undefined,
        search: searchQuery || undefined,
        minPrice: priceFilterActive ? debouncedPriceRange[0] : undefined,
        maxPrice: priceFilterActive ? debouncedPriceRange[1] : undefined,
        availableFrom: dateFilterActive ? pickupDate : undefined,
        availableTo: dateFilterActive ? returnDate : undefined,
      }),
    refetchInterval: 30 * 1000,
  })

  const { data: suggestions } = useQuery({
    queryKey: ["vehicle-suggestions"],
    queryFn: () => VehicleControllerService.getVehicleSuggestions(),
  })

  const dynamicBrands = suggestions ? Object.keys(suggestions).sort() : []
  const vehicles = data?.content || []
  const totalPages = data?.totalPages || 1
  const totalElements = data?.totalElements || 0

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  const resetFilters = () => {
    setSelectedType("")
    setSelectedBrand("")
    setSearchInput("")
    setSearchQuery("")
    setPriceRange([PRICE_MIN, PRICE_MAX])
    setPickupDate("")
    setReturnDate("")
    setCurrentPage(1)
  }

  // Convert string dates ↔ Date objects for the pickers
  const pickupDateObj = pickupDate ? parseISO(pickupDate) : undefined
  const returnDateObj = returnDate ? parseISO(returnDate) : undefined

  const handlePickupSelect = (date: Date | undefined) => {
    setPickupDate(date ? format(date, "yyyy-MM-dd") : "")
    // Clear return date if it's before the new pickup date
    if (date && returnDateObj && returnDateObj <= date) {
      setReturnDate("")
    }
    setCurrentPage(1)
  }

  const handleReturnSelect = (date: Date | undefined) => {
    setReturnDate(date ? format(date, "yyyy-MM-dd") : "")
    setCurrentPage(1)
  }

  const activeDateLabel = dateFilterActive
    ? `${format(parseISO(pickupDate), "MMM d")} – ${format(parseISO(returnDate), "MMM d")}`
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      {/* Search Bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-background min-w-[280px]">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by brand or model"
                className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
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
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto text-sm"
                  onClick={resetFilters}
                >
                  RESET ALL
                </Button>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Dates</h3>
                  {dateFilterActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickupDate("")
                        setReturnDate("")
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                    <DatePicker
                      value={pickupDateObj}
                      onChange={handlePickupSelect}
                      placeholder="Pickup date"
                      align="start"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Return</p>
                    <DatePicker
                      value={returnDateObj}
                      onChange={handleReturnSelect}
                      placeholder="Return date"
                      align="start"
                      disabled={(date) =>
                        pickupDateObj ? date <= pickupDateObj : false
                      }
                    />
                  </div>
                </div>
                {activeDateLabel && (
                  <p className="text-xs text-primary mt-2 font-medium">
                    {activeDateLabel} · Available only
                  </p>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="px-1">
                  <Slider
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={10}
                    value={priceRange}
                    onValueChange={(val) =>
                      setPriceRange(val as [number, number])
                    }
                    className="mb-3"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      RM {priceRange[0]}
                    </span>
                    <span className="text-xs">–</span>
                    <span className="font-medium text-foreground">
                      RM {priceRange[1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Vehicle Type</h3>
                <div className="space-y-2">
                  {vehicleTypes.map((type) => (
                    <label
                      key={type}
                      htmlFor={`type-${type}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedType === type}
                        onCheckedChange={(checked) => {
                          setSelectedType(checked ? type : "")
                          setCurrentPage(1)
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Brand</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {dynamicBrands.map((brand) => (
                    <label
                      key={brand}
                      htmlFor={`brand-${brand}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrand === brand}
                        onCheckedChange={(checked) => {
                          setSelectedBrand(checked ? brand : "")
                          setCurrentPage(1)
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Vehicle Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {totalElements} vehicles available
              </p>
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[150px] bg-transparent">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="year_desc">Newest First</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border">
                <Car className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold">No vehicles found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {vehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="relative group">
                      <img
                        src={
                          vehicle.image_url ||
                          "/assets/images/vehicles/placeholder.png"
                        }
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {Boolean(vehicle.discount && vehicle.discount > 0) && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                          {vehicle.discount}% OFF
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => vehicle.id && toggleFavorite(vehicle.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
                      >
                        <Heart
                          className={`h-5 w-5 ${vehicle.id && favorites.includes(vehicle.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                        />
                      </button>
                      <div className="absolute bottom-3 left-3 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                        {vehicle.type === "Car" ? (
                          <Settings2 className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          {vehicle.fuelType || "Petrol"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {vehicle.seats || (vehicle.type === "Car" ? 4 : 2)}{" "}
                          Seats
                        </span>
                      </div>
                      <div className="flex flex-col mb-5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Price Starting From
                        </span>
                        <div className="flex items-baseline gap-2">
                          <p className="text-primary font-bold text-lg">
                            RM {vehicle.discounted_price || vehicle.rental_rate}
                          </p>
                          {Boolean(
                            vehicle.discount && vehicle.discount > 0,
                          ) && (
                            <span className="text-xs text-muted-foreground line-through opacity-70">
                              RM {vehicle.rental_rate}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal mt-[-4px]">
                          / Day
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                          asChild
                        >
                          <Link
                            to="/vehicles/$id"
                            params={{ id: vehicle.id! }}
                          >
                            Details
                          </Link>
                        </Button>
                        <Button
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                          asChild
                        >
                          <Link
                            to="/vehicles/$id/book"
                            params={{ id: vehicle.id! }}
                            search={{
                              pickup: pickupDate || "",
                              return: returnDate || "",
                            }}
                          >
                            Book Now
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  className="rounded-full"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={i + 1 === currentPage ? "default" : "outline"}
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
