import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface PaymentFormProps {
  onSuccess: (paymentIntentId: string) => void
  onFailure: (paymentIntentId: string, reason: string) => void
  amount: number
}

export function PaymentForm({ onSuccess, onFailure, amount }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage("")

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (error) {
      const msg = error.message ?? "Payment failed. Please try again."
      setErrorMessage(msg)
      // Report failure to backend if we have a paymentIntent ID
      if (error.payment_intent?.id) {
        onFailure(error.payment_intent.id, msg)
      }
      setIsProcessing(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id)
    } else {
      const msg = `Unexpected payment status: ${paymentIntent?.status}`
      setErrorMessage(msg)
      if (paymentIntent?.id) {
        onFailure(paymentIntent.id, msg)
      }
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {errorMessage && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 font-bold shadow-lg shadow-primary/20"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…
          </>
        ) : (
          <>Pay RM {amount.toFixed(2)}</>
        )}
      </Button>
    </form>
  )
}
