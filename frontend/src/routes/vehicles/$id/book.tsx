import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Copy,
  Fuel,
  Loader2,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { BookingControllerService, VehicleControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/vehicles/$id/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    pickup: (search.pickup as string) || "",
    return: (search.return as string) || "",
  }),
  beforeLoad: ({ location }) => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login", search: { next: location.pathname } })
    }
  },
  component: BookingFormPage,
})

function BookingFormPage() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const [startDate, setStartDate] = useState(search.pickup || "")
  const [endDate, setEndDate] = useState(search.return || "")
  const [confirmed, setConfirmed] = useState<{
    ref: string
    total: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const startDateObj = startDate ? parseISO(startDate) : undefined
  const endDateObj = endDate ? parseISO(endDate) : undefined

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date ? format(date, "yyyy-MM-dd") : "")
    // Clear end date if it's no longer after the new start date
    if (date && endDateObj && endDateObj <= date) {
      setEndDate("")
    }
    setError("")
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date ? format(date, "yyyy-MM-dd") : "")
    setError("")
  }

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => VehicleControllerService.getVehicle({ id }),
  })

  const rentalDays = useMemo(() => {
    if (!startDateObj || !endDateObj) return 0
    return Math.max(0, differenceInCalendarDays(endDateObj, startDateObj))
  }, [startDateObj, endDateObj])

  const dailyRate = useMemo(() => {
    if (!vehicle) return 0
    if (vehicle.discount && vehicle.discount > 0) {
      return Number(vehicle.discounted_price || vehicle.rental_rate)
    }
    return Number(vehicle.rental_rate || 0)
  }, [vehicle])

  const totalCost = useMemo(
    () => (rentalDays * dailyRate).toFixed(2),
    [rentalDays, dailyRate],
  )

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: () =>
      BookingControllerService.createBooking({
        requestBody: {
          vehicleId: id,
          startDate: startDate,
          endDate: endDate,
        },
      }),
    onSuccess: (data) => {
      setConfirmed({
        ref: data.confirmationRef!,
        total: Number(data.totalCost),
      })
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
    onError: (err: any) => {
      const msg =
        err?.body?.message || err?.message || "Failed to create booking"
      setError(msg)
      showErrorToast(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!startDate || !endDate) {
      setError("Please select both pickup and return dates.")
      return
    }
    if (rentalDays < 1) {
      setError("Return date must be after pickup date.")
      return
    }
    createBooking()
  }

  const copyRef = () => {
    if (confirmed?.ref) {
      navigator.clipboard.writeText(confirmed.ref)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
          <Button className="mt-6 rounded-full" asChild>
            <Link to="/vehicles">Back to Fleet</Link>
          </Button>
        </div>
        <LandingFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/vehicles" className="hover:text-primary transition-colors">
            Vehicles
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to="/vehicles/$id/"
            params={{ id }}
            className="hover:text-primary transition-colors"
          >
            {vehicle.brand} {vehicle.model}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Book</span>
        </div>

        <AnimatePresence mode="wait">
          {confirmed ? (
            /* ── Confirmation Screen ── */
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Booking Submitted!</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                Your booking request for{" "}
                <strong>
                  {vehicle.brand} {vehicle.model}
                </strong>{" "}
                has been received and is pending admin approval.
              </p>

              <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                  Confirmation Reference
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-black text-primary tracking-wider">
                    {confirmed.ref}
                  </span>
                  <button
                    type="button"
                    onClick={copyRef}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">Copied!</p>
                )}
                <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                  <div className="flex justify-between mb-1">
                    <span>
                      {startDate} → {endDate}
                    </span>
                    <span>
                      {rentalDays} day{rentalDays !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total</span>
                    <span>RM {confirmed.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link to="/vehicles">Browse More</Link>
                </Button>
                <Button asChild>
                  <Link to="/bookings">
                    View My Bookings <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ── Booking Form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Vehicle Summary */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden sticky top-20">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={
                        vehicle.image_url ||
                        "/assets/images/vehicles/placeholder.png"
                      }
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {vehicle.year} · {vehicle.type}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" /> {vehicle.seats} Seats
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel className="h-4 w-4" /> {vehicle.fuelType}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Car className="h-4 w-4" />{" "}
                        {vehicle.transmission?.toLowerCase() || "Manual"}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 pt-4 border-t border-border">
                      <span className="text-2xl font-black text-primary font-mono">
                        RM {dailyRate.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        / day
                      </span>
                    </div>
                    {Boolean(vehicle.discount && vehicle.discount > 0) && (
                      <p className="text-xs text-muted-foreground line-through">
                        RM {vehicle.rental_rate} / day (before discount)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
                  <h1 className="text-2xl font-bold mb-6">
                    Complete Your Booking
                  </h1>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="block text-sm font-semibold mb-1.5">
                          Pickup Date
                        </p>
                        <DatePicker
                          value={startDateObj}
                          onChange={handleStartDateSelect}
                          placeholder="Pickup date"
                          align="start"
                        />
                      </div>
                      <div>
                        <p className="block text-sm font-semibold mb-1.5">
                          Return Date
                        </p>
                        <DatePicker
                          value={endDateObj}
                          onChange={handleEndDateSelect}
                          placeholder="Return date"
                          align="start"
                          disabled={(date) =>
                            startDateObj ? date <= startDateObj : false
                          }
                        />
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    {rentalDays > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-primary/5 border border-primary/15 p-5 space-y-3"
                      >
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                          Cost Summary
                        </h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Daily rate
                          </span>
                          <span>RM {dailyRate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Duration
                          </span>
                          <span>
                            {rentalDays} day{rentalDays !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-primary/15">
                          <span>Total</span>
                          <span className="text-primary font-mono text-lg">
                            RM {totalCost}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        asChild
                      >
                        <Link to="/vehicles/$id/" params={{ id }}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Link>
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                        disabled={isPending || rentalDays < 1}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            Processing…
                          </>
                        ) : (
                          <>
                            Confirm Booking · RM{" "}
                            {rentalDays > 0 ? totalCost : "—"}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <LandingFooter />
    </div>
  )
}
