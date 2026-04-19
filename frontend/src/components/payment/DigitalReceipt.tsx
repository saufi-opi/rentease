import { Link } from "@tanstack/react-router"
import { format, parseISO } from "date-fns"
import { ArrowRight, CheckCircle2, Copy, CreditCard, Download, Landmark } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReceiptData {
  confirmationRef: string
  vehicleBrand: string
  vehicleModel: string
  vehicleImageUrl?: string
  startDate: string
  endDate: string
  rentalDays: number
  totalCost: number
  paymentType?: string
  paymentDate?: string
  gatewayTransactionId?: string
}

interface DigitalReceiptProps {
  receipt: ReceiptData
}

export function DigitalReceipt({ receipt }: DigitalReceiptProps) {
  const [copied, setCopied] = useState(false)

  const copyRef = () => {
    navigator.clipboard.writeText(receipt.confirmationRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const paymentLabel =
    receipt.paymentType === "FPX"
      ? "Online Banking (FPX)"
      : receipt.paymentType === "CARD"
        ? "Card Payment"
        : receipt.paymentType ?? "—"

  const PaymentIcon =
    receipt.paymentType === "FPX" ? Landmark : CreditCard

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; inset: 0; }
        }
      `}</style>

      <div id="receipt-print" className="w-full max-w-sm">
        {/* Success header */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-1">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Your booking for{" "}
          <strong>
            {receipt.vehicleBrand} {receipt.vehicleModel}
          </strong>{" "}
          is confirmed and awaiting admin approval.
        </p>

        {/* Receipt card */}
        <div className="bg-card border border-border rounded-2xl p-6 text-left mb-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Confirmation Ref
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-mono font-black text-primary tracking-wider">
                  {receipt.confirmationRef}
                </span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-0.5">Copied!</p>}
            </div>
          </div>

          {/* Details rows */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-semibold">
                {receipt.vehicleBrand} {receipt.vehicleModel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span className="font-semibold">
                {format(parseISO(receipt.startDate), "d MMM yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Return</span>
              <span className="font-semibold">
                {format(parseISO(receipt.endDate), "d MMM yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold">
                {receipt.rentalDays} day{receipt.rentalDays !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="flex items-center gap-1.5 font-semibold">
                <PaymentIcon className="h-3.5 w-3.5" />
                {paymentLabel}
              </span>
            </div>
            {receipt.paymentDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid On</span>
                <span className="font-semibold">
                  {format(parseISO(receipt.paymentDate), "d MMM yyyy, h:mm a")}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-border font-bold text-base">
            <span>Total Paid</span>
            <span className="text-primary font-mono text-lg">
              RM {receipt.totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Download Receipt
        </Button>
        <Button variant="outline" asChild>
          <Link to="/vehicles">Browse More</Link>
        </Button>
        <Button asChild>
          <Link to="/bookings">
            My Bookings <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
