import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { AlertCircle, Car, Check, ChevronDown, Loader2, MoreHorizontal, Plus, Search, Wrench } from "lucide-react"
import { toast } from "sonner"
import {
  BookingControllerService,
  MaintenanceControllerService,
  VehicleControllerService,
  type MaintenanceRecord,
  type VehicleResponse,
} from "@/client"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute("/admin/_layout/maintenance")({
  component: AdminMaintenance,
  head: () => ({
    meta: [{ title: "Maintenance Management" }],
  }),
})

const STATUS_CONFIG: Record<string, { label: string; badge: React.ReactNode }> =
  {
    SCHEDULED: {
      label: "Scheduled",
      badge: (
        <Badge className="bg-amber-500 hover:bg-amber-600">Scheduled</Badge>
      ),
    },
    IN_PROGRESS: {
      label: "In Progress",
      badge: (
        <Badge className="bg-sky-500 hover:bg-sky-600">In Progress</Badge>
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
  SCHEDULED: [
    { label: "Start Maintenance", next: "IN_PROGRESS" },
    { label: "Cancel", next: "CANCELLED", destructive: true },
  ],
  IN_PROGRESS: [
    { label: "Mark Completed", next: "COMPLETED" },
    { label: "Cancel", next: "CANCELLED", destructive: true },
  ],
}

const MAINTENANCE_TYPES = [
  "OIL_CHANGE",
  "TIRE_ROTATION",
  "BRAKE_INSPECTION",
  "GENERAL_SERVICE",
  "BODY_REPAIR",
  "ENGINE_REPAIR",
  "OTHER",
]

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type PendingUpdate = { id: string; nextStatus: string; label: string }

function AdminMaintenance() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null)
  const [remark, setRemark] = useState("")

  const PAGE_SIZE = 10

  const { data, isLoading } = useQuery({
    queryKey: ["admin-maintenance", currentPage, statusFilter],
    queryFn: () =>
      MaintenanceControllerService.getAllMaintenance({
        page: currentPage - 1,
        size: PAGE_SIZE,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  })

  const { mutate: updateStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status, remark }: { id: string; status: string; remark?: string }) =>
      MaintenanceControllerService.updateMaintenanceStatus({
        id,
        requestBody: { status, remark: remark || undefined },
      }),
    onSuccess: (_, vars) => {
      toast.success("Success", {
        description: `Maintenance status updated to ${vars.status.replace("_", " ")}.`,
      })
      queryClient.invalidateQueries({ queryKey: ["admin-maintenance"] })
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
    onError: (err: any) => {
      toast.error("Error", {
        description: err?.body?.message || "Failed to update maintenance status.",
      })
    },
  })

  const handleConfirmUpdate = () => {
    if (!pendingUpdate) return
    updateStatus({ id: pendingUpdate.id, status: pendingUpdate.nextStatus, remark })
    setPendingUpdate(null)
    setRemark("")
  }

  const records = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Maintenance Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Log and track vehicle maintenance records.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Maintenance
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex justify-end mb-6">
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
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Est. End</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-48 text-center text-muted-foreground"
                  >
                    No maintenance records found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {record.vehicleBrand} {record.vehicleModel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.vehicleType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {record.maintenanceType?.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {record.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {STATUS_CONFIG[record.status!]?.badge ?? (
                        <Badge variant="outline">{record.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(record.scheduledStartDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(record.estimatedEndDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(record.completedAt)}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {record.remark || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <MaintenanceActions
                        record={record}
                        onUpdate={(next, label) => {
                          if (!record.id) return
                          if (next === "COMPLETED") {
                            setPendingUpdate({ id: record.id, nextStatus: next, label })
                          } else {
                            updateStatus({ id: record.id, status: next })
                          }
                        }}
                        disabled={updating}
                      />
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
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, totalElements)} of ${totalElements} records`
              : "No records"}
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

      <CreateMaintenanceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-maintenance"] })
          queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
          queryClient.invalidateQueries({ queryKey: ["vehicles"] })
        }}
      />

      <Dialog
        open={!!pendingUpdate}
        onOpenChange={(open) => {
          if (!open) {
            setPendingUpdate(null)
            setRemark("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingUpdate?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="remark-input">
              Remark{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="remark-input"
              placeholder="Describe the work done or reason for this status change..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingUpdate(null)
                setRemark("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MaintenanceActions({
  record,
  onUpdate,
  disabled,
}: {
  record: MaintenanceRecord
  onUpdate: (next: string, label: string) => void
  disabled: boolean
}) {
  const transitions = TRANSITIONS[record.status!] ?? []
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
            onClick={() => onUpdate(t.next, t.label)}
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

function VehiclePicker({
  value,
  onChange,
}: {
  value: VehicleResponse | null
  onChange: (v: VehicleResponse) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vehicles-picker"],
    queryFn: () => VehicleControllerService.browseVehicles({ size: 200 }),
    staleTime: 30_000,
  })

  const vehicles = data?.content ?? []
  const filtered = search
    ? vehicles.filter((v) =>
        `${v.brand} ${v.model} ${v.type}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : vehicles

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {value ? (
            <>
              <div className="w-14 h-9 rounded-md overflow-hidden bg-muted shrink-0">
                {value.image_url ? (
                  <img
                    src={value.image_url}
                    alt={value.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">
                  {value.brand} {value.model}
                </div>
                <div className="text-xs text-muted-foreground">{value.type}</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-9 rounded-md bg-muted shrink-0 flex items-center justify-center">
                <Car className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left text-muted-foreground">
                Select a vehicle...
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-(--radix-popover-trigger-width)"
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brand or model..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div
          className="max-h-64 overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vehicles found.
            </p>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onChange(v)
                  setOpen(false)
                  setSearch("")
                }}
                className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
              >
                <div className="w-14 h-9 rounded-md overflow-hidden bg-muted shrink-0">
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={v.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-foreground">
                    {v.brand} {v.model}
                  </div>
                  <div className="text-xs text-muted-foreground">{v.type}</div>
                </div>
                {value?.id === v.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CreateMaintenanceDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null)
  const [maintenanceType, setMaintenanceType] = useState("")
  const [description, setDescription] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Fetch bookings for the selected vehicle to highlight booked dates on the calendar
  const { data: vehicleBookings } = useQuery({
    queryKey: ["vehicle-bookings-for-maintenance", selectedVehicle?.id],
    queryFn: () =>
      BookingControllerService.getAllBookings({
        vehicleId: selectedVehicle!.id!,
        size: 200,
      }),
    enabled: !!selectedVehicle?.id,
    staleTime: 30_000,
  })

  // Build an array of every date covered by active bookings for the selected vehicle
  const bookedDates = useMemo(() => {
    if (!vehicleBookings?.content) return []
    const dates: Date[] = []
    for (const b of vehicleBookings.content) {
      if (!b.startDate || !b.endDate) continue
      if (b.status === "CANCELLED" || b.status === "PAYMENT_FAILED") continue
      const start = new Date(b.startDate)
      const end = new Date(b.endDate)
      const cursor = new Date(start)
      while (cursor <= end) {
        dates.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return dates
  }, [vehicleBookings])

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      MaintenanceControllerService.createMaintenance({
        requestBody: {
          vehicleId: selectedVehicle!.id!,
          maintenanceType,
          description: description || undefined,
          scheduledStartDate: format(dateRange.from!, "yyyy-MM-dd"),
          estimatedEndDate: format(dateRange.to!, "yyyy-MM-dd"),
        },
      }),
    onSuccess: () => {
      toast.success("Maintenance scheduled", {
        description: "Maintenance window has been logged. The vehicle is available until maintenance starts.",
      })
      onCreated()
      handleClose()
    },
    onError: (err: any) => {
      toast.error("Error", {
        description: err?.body?.message || "Failed to log maintenance.",
      })
    },
  })

  function handleClose() {
    setSelectedVehicle(null)
    setMaintenanceType("")
    setDescription("")
    setDateRange({ from: undefined, to: undefined })
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVehicle || !maintenanceType || !dateRange.from || !dateRange.to) return
    create()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Maintenance Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <VehiclePicker value={selectedVehicle} onChange={setSelectedVehicle} />
          </div>

          <div className="space-y-2">
            <Label>Maintenance Window</Label>
            {selectedVehicle ? (
              <>
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onSelect={setDateRange}
                  placeholder="Select start & end dates"
                  numberOfMonths={1}
                  align="start"
                  modifiers={bookedDates.length > 0 ? { booked: bookedDates } : undefined}
                  modifiersClassNames={
                    bookedDates.length > 0
                      ? { booked: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full" }
                      : undefined
                  }
                />
                {bookedDates.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-300 dark:bg-red-900/30" />
                    Dates highlighted in red have existing bookings — pick a window around them.
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Select a vehicle first to see its booking calendar.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceType">Maintenance Type</Label>
            <Select value={maintenanceType} onValueChange={setMaintenanceType} required>
              <SelectTrigger id="maintenanceType" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the maintenance work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedVehicle || !maintenanceType || !dateRange.from || !dateRange.to}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Logging...
                </>
              ) : (
                "Log Maintenance"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
