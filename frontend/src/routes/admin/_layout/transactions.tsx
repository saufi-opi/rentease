import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  CreditCard,
  Landmark,
  Loader2,
  MoreHorizontal,
  Receipt,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

async function fetchPayments(page: number, size: number) {
  const res = await fetch(
    `${API_BASE}/api/v1/admin/payments?page=${page}&size=${size}`,
    { headers: { Authorization: `Bearer ${getAccessToken()}` } },
  )
  if (!res.ok) throw new Error("Failed to fetch payments")
  return res.json()
}

export const Route = createFileRoute("/admin/_layout/transactions")({
  component: AdminTransactions,
  head: () => ({
    meta: [{ title: "Transactions - Admin" }],
  }),
})

interface PaymentRecord {
  id: string
  bookingId: string
  confirmationRef: string
  customerName: string
  vehicleName: string
  amount: number
  status: string
  paymentType?: string
  paymentDate?: string
  refundAmount?: number
  refundedAt?: string
  createdAt: string
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  PAID: <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>,
  PENDING: <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>,
  FAILED: <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>,
  REFUNDED: <Badge className="bg-purple-500 hover:bg-purple-600">Refunded</Badge>,
  PARTIALLY_REFUNDED: <Badge className="bg-violet-500 hover:bg-violet-600">Part. Refunded</Badge>,
}

function AdminTransactions() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null)
  const [refundAmountInput, setRefundAmountInput] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: () => fetchPayments(page, 10),
  })

  const payments: PaymentRecord[] = data?.content ?? []
  const totalPages: number = data?.totalPages ?? 1

  const filteredPayments = search
    ? payments.filter(
        (p) =>
          p.confirmationRef?.toLowerCase().includes(search.toLowerCase()) ||
          p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          p.vehicleName?.toLowerCase().includes(search.toLowerCase()),
      )
    : payments

  const { mutate: processRefund, isPending: isRefunding } = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      apiPost(`/api/v1/admin/payments/${id}/refund`, amount ? { amount } : {}),
    onSuccess: () => {
      showSuccessToast("Refund processed successfully.")
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] })
      setRefundTarget(null)
      setRefundAmountInput("")
    },
    onError: (err: any) => {
      showErrorToast(err.message || "Failed to process refund.")
    },
  })

  const handleRefundSubmit = () => {
    if (!refundTarget) return
    const amount = refundAmountInput ? parseFloat(refundAmountInput) : undefined
    processRefund({ id: refundTarget.id, amount })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          Transaction Log
        </h1>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Input
          placeholder="Search by ref, customer or vehicle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-3"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Ref</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Vehicle</TableHead>
              <TableHead className="font-bold">Method</TableHead>
              <TableHead className="font-bold text-right">Amount</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-16 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/20">
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.paymentDate
                      ? format(parseISO(payment.paymentDate), "d MMM yyyy")
                      : payment.createdAt
                        ? format(parseISO(payment.createdAt), "d MMM yyyy")
                        : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {payment.confirmationRef}
                  </TableCell>
                  <TableCell className="text-sm">{payment.customerName}</TableCell>
                  <TableCell className="text-sm">{payment.vehicleName}</TableCell>
                  <TableCell>
                    {payment.paymentType === "FPX" ? (
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <Landmark className="h-3.5 w-3.5" /> FPX
                      </span>
                    ) : payment.paymentType === "CARD" ? (
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <CreditCard className="h-3.5 w-3.5" /> Card
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    RM {Number(payment.amount).toFixed(2)}
                    {payment.refundAmount && (
                      <div className="text-[10px] text-purple-600 font-normal">
                        −RM {Number(payment.refundAmount).toFixed(2)} refunded
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {STATUS_BADGE[payment.status] ?? (
                      <Badge variant="outline">{payment.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(payment.status === "PAID" || payment.status === "PARTIALLY_REFUNDED") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setRefundTarget(payment)
                              setRefundAmountInput(
                                Number(payment.amount).toFixed(2),
                              )
                            }}
                          >
                            Issue Refund
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={() => setRefundTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Refund for{" "}
                  <strong>{refundTarget.confirmationRef}</strong> ·{" "}
                  {refundTarget.customerName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5">
                  Refund Amount (RM)
                </p>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundTarget.amount}
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: RM {Number(refundTarget.amount).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRefundTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={isRefunding}
                  onClick={handleRefundSubmit}
                >
                  {isRefunding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Refund"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
