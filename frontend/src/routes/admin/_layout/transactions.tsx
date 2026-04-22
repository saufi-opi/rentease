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
  Search,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

async function fetchPayments(page: number, size: number, status?: string) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (status) params.set("status", status)
  const res = await fetch(`${API_BASE}/api/v1/admin/payments?${params}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) throw new Error("Failed to fetch payments")
  return res.json()
}

export const Route = createFileRoute("/admin/_layout/transactions")({
  component: AdminTransactions,
  head: () => ({
    meta: [{ title: "Transactions" }],
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

const PAGE_SIZE = 10

function AdminTransactions() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null)
  const [refundAmountInput, setRefundAmountInput] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", currentPage, statusFilter],
    queryFn: () =>
      fetchPayments(
        currentPage - 1,
        PAGE_SIZE,
        statusFilter !== "ALL" ? statusFilter : undefined,
      ),
  })

  const payments: PaymentRecord[] = data?.content ?? []
  const totalPages: number = data?.totalPages ?? 1
  const totalElements: number = data?.totalElements ?? 0

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Transaction Log
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all payment transactions and refunds.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ref, customer or vehicle…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Part. Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-48 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.paymentDate
                        ? format(parseISO(payment.paymentDate), "d MMM yyyy")
                        : payment.createdAt
                          ? format(parseISO(payment.createdAt), "d MMM yyyy")
                          : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {payment.confirmationRef}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {payment.customerName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.vehicleName}
                    </TableCell>
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
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary font-mono">
                        RM {Number(payment.amount).toFixed(2)}
                      </span>
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
                    <TableCell className="text-right">
                      {(payment.status === "PAID" ||
                        payment.status === "PARTIALLY_REFUNDED") && (
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

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            {totalElements > 0
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, totalElements)} of ${totalElements} transactions`
              : "No transactions"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

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
                <p className="text-xs font-semibold mb-1.5">Refund Amount (RM)</p>
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
