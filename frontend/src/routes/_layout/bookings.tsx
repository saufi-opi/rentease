import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { motion } from "framer-motion"
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { BookingControllerService, type BookingResponse } from "@/client"
import { PaymentForm } from "@/components/payment/PaymentForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    throw new Error((err as any).message ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

interface PaymentIntentData {
  clientSecret: string
  publishableKey: string
  paymentId: string
  amount: number
}

export const Route = createFileRoute("/_layout/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [{ title: "My Bookings - RentEase" }],
  }),
})

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-500/10 text-green-600 border-green-200" },
  PENDING: { label: "Unpaid", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-200" },
  REFUNDED: { label: "Refunded", className: "bg-purple-500/10 text-purple-600 border-purple-200" },
  PARTIALLY_REFUNDED: { label: "Part. Refunded", className: "bg-violet-500/10 text-violet-600 border-violet-200" },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-sky-500/10 text-sky-600 border-sky-200",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-500/10 text-rose-600 border-rose-200",
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    className: "bg-red-500/10 text-red-700 border-red-300",
  },
}

function statusBadgeClass(status: string) {
  return (
    STATUS_CONFIG[status]?.className ??
    "bg-muted text-muted-foreground border-border"
  )
}

function statusLabel(status: string) {
  return STATUS_CONFIG[status]?.label ?? status
}

function BookingsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<BookingResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // Retry payment state
  const [retryTarget, setRetryTarget] = useState<BookingResponse | null>(null)
  const [retryStep, setRetryStep] = useState<"loading" | "payment" | "done">("loading")
  const [retryIntentData, setRetryIntentData] = useState<PaymentIntentData | null>(null)
  const [retryError, setRetryError] = useState("")

  const stripePromise = useMemo(
    () => (retryIntentData?.publishableKey ? loadStripe(retryIntentData.publishableKey) : null),
    [retryIntentData?.publishableKey],
  )

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => BookingControllerService.getMyBookings(),
  })

  const { mutate: cancelBooking, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => BookingControllerService.cancelBooking({ id }),
    onSuccess: () => {
      showSuccessToast("Booking cancelled successfully.")
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setCancelTarget(null)
      setSelectedBooking(null)
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.message || "Failed to cancel booking.")
      setCancelTarget(null)
    },
  })

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canCancel = (status: string) =>
    status === "PENDING" || status === "CONFIRMED" || status === "PAYMENT_FAILED"

  const openRetryDialog = async (booking: BookingResponse) => {
    setRetryTarget(booking)
    setRetryStep("loading")
    setRetryIntentData(null)
    setRetryError("")
    try {
      const intent = await apiPost<PaymentIntentData>("/api/v1/payments/create-intent", {
        bookingId: booking.id,
      })
      setRetryIntentData(intent)
      setRetryStep("payment")
    } catch (err: any) {
      setRetryError(err.message || "Failed to initialise payment.")
    }
  }

  const closeRetryDialog = () => {
    setRetryTarget(null)
    setRetryIntentData(null)
    setRetryError("")
    setRetryStep("loading")
  }

  const handleRetrySuccess = async (paymentIntentId: string) => {
    try {
      await apiPost("/api/v1/payments/confirm", { paymentIntentId })
      setRetryStep("done")
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setTimeout(closeRetryDialog, 2000)
    } catch (err: any) {
      showErrorToast(err.message || "Payment confirmed but failed to save. Contact support.")
    }
  }

  const handleRetryFailure = async (paymentIntentId: string, reason: string) => {
    try {
      await apiPost("/api/v1/payments/failed", { paymentIntentId, reason })
    } catch {
      // best-effort
    }
    queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const list = bookings ?? []

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="text-xl font-bold text-primary">
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Car className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-semibold">No bookings yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Start browsing vehicles to make your first reservation.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {list.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -3 }}
                  className="flex gap-4 rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={
                        booking.vehicleImageUrl ||
                        "/assets/images/vehicles/placeholder.png"
                      }
                      alt={`${booking.vehicleBrand} ${booking.vehicleModel}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold truncate">
                        {booking.vehicleBrand} {booking.vehicleModel}
                      </h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${statusBadgeClass(booking.status!)}`}
                        >
                          {statusLabel(booking.status!)}
                        </Badge>
                        {booking.paymentStatus && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1 ${PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.className ?? "bg-muted text-muted-foreground"}`}
                          >
                            {booking.paymentStatus === "FPX" ? (
                              <Landmark className="h-2.5 w-2.5" />
                            ) : (
                              <CreditCard className="h-2.5 w-2.5" />
                            )}
                            {PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.label ?? booking.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-1 font-mono">
                      {booking.confirmationRef}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      {booking.startDate} → {booking.endDate}
                      <span className="ml-1">
                        ({booking.rentalDays} day
                        {booking.rentalDays !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-bold text-primary uppercase tracking-tight"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        View Details
                      </Button>
                      <div className="flex items-center gap-2">
                        {booking.status === "PAYMENT_FAILED" && (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs font-bold bg-primary"
                            onClick={() => openRetryDialog(booking)}
                          >
                            Pay Now
                          </Button>
                        )}
                        {canCancel(booking.status!) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setCancelTarget(booking)}
                          >
                            Cancel
                          </Button>
                        )}
                        <span className="font-black text-primary text-lg tracking-tight">
                          RM {Number(booking.totalCost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                <img
                  src={
                    selectedBooking.vehicleImageUrl ||
                    "/assets/images/vehicles/placeholder.png"
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>

              <div>
                <h3 className="font-bold text-lg">
                  {selectedBooking.vehicleBrand} {selectedBooking.vehicleModel}
                </h3>
                <Badge
                  variant="outline"
                  className={`mt-1 text-[10px] font-bold uppercase ${statusBadgeClass(selectedBooking.status!)}`}
                >
                  {statusLabel(selectedBooking.status!)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Ref</p>
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    {selectedBooking.confirmationRef}
                    <button
                      onClick={() => copyRef(selectedBooking.confirmationRef!)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {copied && <p className="text-xs text-green-600">Copied!</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Total</p>
                  <p className="font-bold text-primary">
                    RM {Number(selectedBooking.totalCost).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Pickup</p>
                  <p className="font-semibold">{selectedBooking.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Return</p>
                  <p className="font-semibold">{selectedBooking.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Duration</p>
                  <p className="font-semibold">
                    {selectedBooking.rentalDays} day
                    {selectedBooking.rentalDays !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Booked On</p>
                  <p className="font-semibold">
                    {selectedBooking.createdAt?.split("T")[0]}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {selectedBooking.status === "PAYMENT_FAILED" && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedBooking(null)
                      openRetryDialog(selectedBooking)
                    }}
                  >
                    Retry Payment
                  </Button>
                )}
                {canCancel(selectedBooking.status!) && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCancelTarget(selectedBooking)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-rose-500" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Are you sure you want to cancel booking{" "}
              <strong>{cancelTarget?.confirmationRef}</strong>?{" "}
              {cancelTarget?.paymentStatus === "PAID"
                ? "A full refund will be issued automatically."
                : "This action cannot be undone."}
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCancelTarget(null)}
              >
                Keep It
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelling}
                onClick={() => cancelTarget?.id && cancelBooking(cancelTarget.id)}
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Retry Payment Dialog */}
      <Dialog open={!!retryTarget} onOpenChange={closeRetryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>

          {retryStep === "done" ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Payment Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your booking is now confirmed.
                </p>
              </div>
            </div>
          ) : retryStep === "loading" ? (
            <div className="flex flex-col items-center gap-4 py-8">
              {retryError ? (
                <>
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 w-full">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {retryError}
                  </div>
                  <Button variant="outline" onClick={closeRetryDialog}>Close</Button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Preparing payment…</p>
                </>
              )}
            </div>
          ) : (
            retryIntentData && stripePromise && (
              <div className="space-y-4 pt-2">
                <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    {retryTarget?.vehicleBrand} {retryTarget?.vehicleModel}
                  </span>
                  <span className="font-black text-primary font-mono">
                    RM {Number(retryTarget?.totalCost).toFixed(2)}
                  </span>
                </div>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: retryIntentData.clientSecret,
                    appearance: { theme: "stripe" },
                  }}
                >
                  <PaymentForm
                    amount={Number(retryTarget?.totalCost ?? 0)}
                    onSuccess={handleRetrySuccess}
                    onFailure={handleRetryFailure}
                  />
                </Elements>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
