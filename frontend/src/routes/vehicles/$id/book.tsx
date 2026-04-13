import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowLeft,
  Car,
  ChevronRight,
  Fuel,
  Loader2,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { BookingControllerService, VehicleControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { DigitalReceipt } from "@/components/payment/DigitalReceipt"
import { PaymentForm } from "@/components/payment/PaymentForm"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { getAccessToken } from "@/lib/axios"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

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

type Step = "dates" | "payment" | "receipt"

interface PaymentIntentData {
  clientSecret: string
  publishableKey: string
  paymentId: string
  amount: number
}

interface PaymentResult {
  confirmationRef: string
  paymentType?: string
  paymentDate?: string
  gatewayTransactionId?: string
}

function BookingFormPage() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const [step, setStep] = useState<Step>("dates")
  const [startDate, setStartDate] = useState(search.pickup || "")
  const [endDate, setEndDate] = useState(search.return || "")
  const [error, setError] = useState("")
  const [paymentIntentData, setPaymentIntentData] = useState<PaymentIntentData | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [isInitiating, setIsInitiating] = useState(false)

  const stripePromise = useMemo(
    () => (paymentIntentData?.publishableKey ? loadStripe(paymentIntentData.publishableKey) : null),
    [paymentIntentData?.publishableKey],
  )

  const startDateObj = startDate ? parseISO(startDate) : undefined
  const endDateObj = endDate ? parseISO(endDate) : undefined

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date ? format(date, "yyyy-MM-dd") : "")
    if (date && endDateObj && endDateObj <= date) setEndDate("")
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

  const { mutate: createBooking, isPending: isCreatingBooking } = useMutation({
    mutationFn: () =>
      BookingControllerService.createBooking({
        requestBody: { vehicleId: id, startDate, endDate },
      }),
    onSuccess: async (booking) => {
      const bid = booking.id!
      setIsInitiating(true)
      try {
        const intent = await apiPost<PaymentIntentData>(
          "/api/v1/payments/create-intent",
          { bookingId: bid },
        )
        setPaymentIntentData(intent)
        setStep("payment")
      } catch (err: any) {
        setError(err.message || "Failed to initialise payment. Please try again.")
        showErrorToast(err.message || "Payment initialisation failed.")
      } finally {
        setIsInitiating(false)
      }
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message || "Failed to create booking"
      setError(msg)
      showErrorToast(msg)
    },
  })

  const handleProceedToPayment = (e: React.FormEvent) => {
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

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const result = await apiPost<PaymentResult>("/api/v1/payments/confirm", {
        paymentIntentId,
      })
      setPaymentResult(result)
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setStep("receipt")
    } catch (err: any) {
      showErrorToast(err.message || "Payment confirmed but failed to save. Contact support.")
    }
  }

  const handlePaymentFailure = async (paymentIntentId: string, reason: string) => {
    try {
      await apiPost("/api/v1/payments/failed", { paymentIntentId, reason })
    } catch {
      // best-effort
    }
    setError(reason || "Payment failed. Please try again.")
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
            to="/vehicles/$id"
            params={{ id }}
            className="hover:text-primary transition-colors"
          >
            {vehicle.brand} {vehicle.model}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Book</span>
        </div>

        <AnimatePresence mode="wait">
          {step === "receipt" && vehicle && paymentResult ? (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <DigitalReceipt
                receipt={{
                  confirmationRef: paymentResult.confirmationRef,
                  vehicleBrand: vehicle.brand!,
                  vehicleModel: vehicle.model!,
                  vehicleImageUrl: vehicle.image_url ?? undefined,
                  startDate,
                  endDate,
                  rentalDays,
                  totalCost: Number(totalCost),
                  paymentType: paymentResult.paymentType,
                  paymentDate: paymentResult.paymentDate,
                  gatewayTransactionId: paymentResult.gatewayTransactionId,
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Vehicle Summary Sidebar */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden sticky top-20">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={vehicle.image_url || "/assets/images/vehicles/placeholder.png"}
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
                      <span className="text-muted-foreground text-sm">/ day</span>
                    </div>
                    {Boolean(vehicle.discount && vehicle.discount > 0) && (
                      <p className="text-xs text-muted-foreground line-through">
                        RM {vehicle.rental_rate} / day (before discount)
                      </p>
                    )}
                    {rentalDays > 0 && (
                      <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>RM {dailyRate.toFixed(2)} × {rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span className="text-primary font-mono">RM {totalCost}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Form Area */}
              <div className="lg:col-span-3">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === "dates" ? "text-primary" : "text-muted-foreground"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "dates" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                      Dates
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                      Payment
                    </div>
                  </div>

                  {step === "dates" && (
                    <form onSubmit={handleProceedToPayment} className="space-y-6">
                      <h1 className="text-2xl font-bold">Select Your Dates</h1>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="block text-sm font-semibold mb-1.5">Pickup Date</p>
                          <DatePicker
                            value={startDateObj}
                            onChange={handleStartDateSelect}
                            placeholder="Pickup date"
                            align="start"
                          />
                        </div>
                        <div>
                          <p className="block text-sm font-semibold mb-1.5">Return Date</p>
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

                      {error && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 h-12" asChild>
                          <Link to="/vehicles/$id" params={{ id }}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                          </Link>
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                          disabled={isCreatingBooking || isInitiating || rentalDays < 1}
                        >
                          {isCreatingBooking || isInitiating ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparing…</>
                          ) : (
                            <>Proceed to Payment · RM {rentalDays > 0 ? totalCost : "—"}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {step === "payment" && paymentIntentData && (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl font-bold">Complete Payment</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          Choose card or online banking (FPX) to pay RM {totalCost}.
                        </p>
                      </div>

                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: paymentIntentData.clientSecret,
                          appearance: { theme: "stripe" },
                        }}
                      >
                        <PaymentForm
                          amount={Number(totalCost)}
                          onSuccess={handlePaymentSuccess}
                          onFailure={handlePaymentFailure}
                        />
                      </Elements>

                      {error && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {error}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => {
                          setStep("dates")
                          setError("")
                        }}
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Change dates
                      </Button>
                    </div>
                  )}
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
