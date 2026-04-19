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
  ScrollText,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { BookingControllerService, MaintenanceControllerService, VehicleControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { DigitalReceipt } from "@/components/payment/DigitalReceipt"
import { PaymentForm } from "@/components/payment/PaymentForm"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

type Step = "dates" | "tnc" | "payment" | "receipt"

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
  const [tncAccepted, setTncAccepted] = useState(false)

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

  const { data: maintenanceData } = useQuery({
    queryKey: ["vehicle-maintenance-public", id],
    queryFn: () => MaintenanceControllerService.getVehicleMaintenance({ vehicleId: id, size: 50 }),
    staleTime: 60_000,
  })

  const maintenanceConflict = useMemo(() => {
    if (!startDate || !endDate || !maintenanceData?.content) return null
    const s = new Date(startDate)
    const e = new Date(endDate)
    return (
      maintenanceData.content.find((m) => {
        if (m.status !== "SCHEDULED" && m.status !== "IN_PROGRESS") return false
        if (!m.scheduledStartDate || !m.estimatedEndDate) return false
        const ms = new Date(m.scheduledStartDate)
        const me = new Date(m.estimatedEndDate)
        return ms < e && me > s
      }) ?? null
    )
  }, [maintenanceData, startDate, endDate])

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

  const handleProceedToTnc = (e: React.FormEvent) => {
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
    setStep("tnc")
  }

  const handleConfirmBooking = () => {
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
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === "tnc" ? "text-primary" : "text-muted-foreground"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "tnc" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                      Terms
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
                      Payment
                    </div>
                  </div>

                  {step === "dates" && (
                    <form onSubmit={handleProceedToTnc} className="space-y-6">
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

                      {maintenanceConflict && (
                        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                          <div>
                            <p className="font-medium">Maintenance scheduled during this period</p>
                            <p className="text-xs mt-0.5 opacity-80">
                              This vehicle has a{" "}
                              {maintenanceConflict.maintenanceType?.replace(/_/g, " ")} scheduled
                              from {maintenanceConflict.scheduledStartDate} to{" "}
                              {maintenanceConflict.estimatedEndDate}. Your booking may not be confirmed.
                            </p>
                          </div>
                        </div>
                      )}

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
                          disabled={rentalDays < 1}
                        >
                          Review Terms · RM {rentalDays > 0 ? totalCost : "—"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {step === "tnc" && (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl font-bold">Review & Confirm</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please review your booking summary and agree to the terms before proceeding to payment.
                        </p>
                      </div>

                      {/* Booking summary */}
                      <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vehicle</span>
                          <span className="font-semibold">{vehicle.brand} {vehicle.model} ({vehicle.year})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pickup Date</span>
                          <span className="font-semibold">{startDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Return Date</span>
                          <span className="font-semibold">{endDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-semibold">{rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 mt-2">
                          <span className="font-bold">Total Payable</span>
                          <span className="font-black text-primary font-mono">RM {totalCost}</span>
                        </div>
                      </div>

                      {/* T&C */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ScrollText className="h-4 w-4 text-primary" />
                          Terms & Conditions
                        </div>
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-3 leading-relaxed">
                          <p><strong className="text-foreground">1. Rental Period</strong><br />
                          The rental period begins on the pickup date and ends on the return date as specified above. Late returns are subject to a surcharge of 50% of the daily rate per additional day.</p>

                          <p><strong className="text-foreground">2. Driver Requirements</strong><br />
                          The renter must hold a valid driving licence appropriate for the rented vehicle category. The licence must be presented upon vehicle collection. Minimum age is 21 years.</p>

                          <p><strong className="text-foreground">3. Vehicle Condition & Damage</strong><br />
                          The vehicle must be returned in the same condition as received. The renter is fully liable for any damage, loss, or theft occurring during the rental period. A damage assessment will be conducted upon return.</p>

                          <p><strong className="text-foreground">4. Fuel Policy</strong><br />
                          The vehicle is provided with a full tank and must be returned with a full tank. Failure to do so will incur a refuelling charge plus a service fee.</p>

                          <p><strong className="text-foreground">5. Cancellation Policy</strong><br />
                          Bookings cancelled within 24 hours of creation are eligible for a full refund. Cancellations made after 24 hours may be subject to a 50% cancellation fee. Cancellations within 12 hours of the pickup date are non-refundable.</p>

                          <p><strong className="text-foreground">6. Prohibited Use</strong><br />
                          The vehicle may not be sub-rented, used for commercial hire, used outside permitted areas, or operated under the influence of alcohol or drugs. Violation of this clause voids all insurance coverage.</p>

                          <p><strong className="text-foreground">7. Insurance</strong><br />
                          Basic insurance coverage is included. The renter is responsible for any excess/deductible amounts in the event of a claim. Comprehensive coverage upgrades are available at the rental counter.</p>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="tnc-accept"
                          checked={tncAccepted}
                          onCheckedChange={(checked) => setTncAccepted(!!checked)}
                          className="mt-0.5"
                        />
                        <label htmlFor="tnc-accept" className="text-sm cursor-pointer leading-relaxed">
                          I have read and agree to the <span className="font-semibold text-foreground">Terms & Conditions</span> above. I confirm the booking details are correct.
                        </label>
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 px-5"
                          onClick={() => { setStep("dates"); setTncAccepted(false) }}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Edit Dates
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-12 px-5 text-muted-foreground"
                          asChild
                        >
                          <Link to="/vehicles/$id" params={{ id }}>Cancel</Link>
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                          disabled={!tncAccepted || isCreatingBooking || isInitiating}
                          onClick={handleConfirmBooking}
                        >
                          {isCreatingBooking || isInitiating ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparing Payment…</>
                          ) : (
                            <>Confirm & Pay RM {totalCost}</>
                          )}
                        </Button>
                      </div>
                    </div>
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
                          setStep("tnc")
                          setError("")
                        }}
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to review
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
