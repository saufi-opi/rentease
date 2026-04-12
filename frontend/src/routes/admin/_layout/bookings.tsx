import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ClipboardList, Loader2, MoreHorizontal, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { BookingControllerService, type BookingResponse } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export const Route = createFileRoute("/admin/_layout/bookings")({
  component: AdminBookings,
  head: () => ({
    meta: [{ title: "Booking Management - Admin" }],
  }),
})

const STATUS_CONFIG: Record<string, { label: string; badge: React.ReactNode }> =
  {
    PENDING: {
      label: "Pending",
      badge: <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>,
    },
    CONFIRMED: {
      label: "Confirmed",
      badge: <Badge className="bg-sky-500 hover:bg-sky-600">Confirmed</Badge>,
    },
    ACTIVE: {
      label: "Active",
      badge: (
        <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
      ),
    },
    COMPLETED: {
      label: "Completed",
      badge: <Badge variant="secondary">Completed</Badge>,
    },
    CANCELLED: {
      label: "Cancelled",
      badge: <Badge variant="destructive">Cancelled</Badge>,
    },
  }

const TRANSITIONS: Record<
  string,
  { label: string; next: string; destructive?: boolean }[]
> = {
  PENDING: [
    { label: "Confirm", next: "CONFIRMED" },
    { label: "Cancel", next: "CANCELLED", destructive: true },
  ],
  CONFIRMED: [
    { label: "Mark Active", next: "ACTIVE" },
    { label: "Cancel", next: "CANCELLED", destructive: true },
  ],
  ACTIVE: [
    { label: "Mark Completed", next: "COMPLETED" },
    { label: "Cancel", next: "CANCELLED", destructive: true },
  ],
}

function AdminBookings() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const PAGE_SIZE = 10

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", currentPage, search, statusFilter],
    queryFn: () =>
      BookingControllerService.getAllBookings({
        page: currentPage - 1,
        size: PAGE_SIZE,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  })

  const { mutate: updateStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      BookingControllerService.updateBookingStatus({
        id,
        requestBody: { status },
      }),
    onSuccess: (_, vars) => {
      toast.success("Success", {
        description: `Booking updated to ${vars.status}.`,
      })
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
    onError: (err: any) => {
      toast.error("Error", {
        description: err?.body?.message || "Failed to update booking.",
      })
    },
  })

  const bookings = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const filteredBookings = search
    ? bookings.filter((b) =>
        `${b.vehicleBrand} ${b.vehicleModel} ${b.customerName} ${b.customerEmail} ${b.confirmationRef}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : bookings

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Booking Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all customer bookings and their statuses.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle, customer, ref..."
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48 text-center text-muted-foreground"
                  >
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-9 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={
                              booking.vehicleImageUrl ||
                              "/assets/images/vehicles/placeholder.png"
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {booking.vehicleBrand} {booking.vehicleModel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.vehicleType}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {booking.customerName || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {booking.confirmationRef}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {booking.startDate} → {booking.endDate}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.rentalDays} day
                        {booking.rentalDays !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      RM {Number(booking.totalCost).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {STATUS_CONFIG[booking.status!]?.badge ?? (
                        <Badge variant="outline">{booking.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <BookingActions
                        booking={booking}
                        onUpdate={(next) =>
                          booking.id &&
                          updateStatus({ id: booking.id, status: next })
                        }
                        disabled={updating}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            {totalElements > 0
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, totalElements)} of ${totalElements} bookings`
              : "No bookings"}
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
              {currentPage} / {totalPages}
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
    </div>
  )
}

function BookingActions({
  booking,
  onUpdate,
  disabled,
}: {
  booking: BookingResponse
  onUpdate: (next: string) => void
  disabled: boolean
}) {
  const transitions = TRANSITIONS[booking.status!] ?? []
  if (transitions.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transitions.map((t) => (
          <DropdownMenuItem
            key={t.next}
            onClick={() => onUpdate(t.next)}
            className={
              t.destructive ? "text-destructive focus:text-destructive" : ""
            }
          >
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
