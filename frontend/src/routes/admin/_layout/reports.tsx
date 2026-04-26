import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  BarChart2,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAccessToken } from "@/lib/axios"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

// ─── Types ───────────────────────────────────────────────────────────────────

type MonthlyDataPoint = { year: number; month: number; label: string; amount: number }
type StatusCount = { label: string; count: number }
type TopVehicleItem = { vehicleId: string; brand: string; model: string; type: string; bookingCount: number; revenue: number }
type TopCustomerItem = { customerId: string; customerName: string; bookingCount: number; totalSpend: number }
type PaymentMethodBreakdown = { method: string; count: number; amount: number }
type ReportSummary = {
  startDate: string
  endDate: string
  vehicleType: string | null
  status: string | null
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  cancellationRate: number
  completionRate: number
  averageRentalDays: number | null
  averageLeadTimeDays: number | null
  revenueGrowthPercent: number | null
  previousPeriodRevenue: number
  revenueByMonth: MonthlyDataPoint[]
  bookingsByStatus: StatusCount[]
  bookingsByVehicleType: StatusCount[]
  bookingsByDayOfWeek: StatusCount[]
  revenueByPaymentMethod: PaymentMethodBreakdown[]
  topCustomers: TopCustomerItem[]
  topVehicles: TopVehicleItem[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", ACTIVE: "#10b981",
  COMPLETED: "#6b7280", CANCELLED: "#ef4444", PAYMENT_FAILED: "#dc2626",
}
const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRM(value: number) {
  return `RM ${Number(value).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function GrowthBadge({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value == null) return null
  const positive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

function RateLabel({ value, warn = 20, good = 10 }: { value: number; warn: number; good: number }) {
  const color = value <= good ? "text-emerald-600" : value <= warn ? "text-amber-600" : "text-red-600"
  return <span className={`font-black text-2xl ${color}`}>{value.toFixed(1)}%</span>
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchReportSummary(startDate: string, endDate: string): Promise<ReportSummary> {
  const url = new URL(`${API_BASE}/api/v1/admin/reports/summary`)
  if (startDate) url.searchParams.set("startDate", startDate)
  if (endDate) url.searchParams.set("endDate", endDate)
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${getAccessToken()}` } })
  if (!res.ok) throw new Error("Failed to fetch report")
  return res.json()
}

// ─── Exports ─────────────────────────────────────────────────────────────────

function exportPDF(data: ReportSummary) {
  import("jspdf").then(async ({ default: jsPDF }) => {
    const autoTable = (await import("jspdf-autotable")).default
    const doc = new jsPDF()
    const now = format(new Date(), "dd MMM yyyy HH:mm")

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("RentEase — Business Intelligence Report", 14, 20)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated: ${now}   |   Period: ${data.startDate} → ${data.endDate}`, 14, 28)

    // KPI summary
    autoTable(doc, {
      startY: 34,
      head: [["KPI", "Value"]],
      body: [
        ["Total Revenue", formatRM(data.totalRevenue)],
        ["Revenue Growth (vs prev period)", data.revenueGrowthPercent != null ? `${data.revenueGrowthPercent > 0 ? "+" : ""}${data.revenueGrowthPercent.toFixed(1)}%` : "N/A"],
        ["Total Bookings", data.totalBookings.toString()],
        ["Avg Booking Value", formatRM(data.averageBookingValue)],
        ["Completion Rate", `${data.completionRate.toFixed(1)}%`],
        ["Cancellation Rate", `${data.cancellationRate.toFixed(1)}%`],
        ["Avg Rental Duration", data.averageRentalDays != null ? `${data.averageRentalDays.toFixed(1)} days` : "N/A"],
        ["Avg Lead Time", data.averageLeadTimeDays != null ? `${data.averageLeadTimeDays.toFixed(1)} days` : "N/A"],
      ],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    })

    let y = (doc as any).lastAutoTable.finalY + 8

    autoTable(doc, {
      startY: y,
      head: [["Month", "Revenue (RM)"]],
      body: data.revenueByMonth.map((r) => [r.label, formatRM(r.amount)]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      didDrawPage: () => { doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Revenue by Month", 14, y - 2) },
    })

    y = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Payment Methods", 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [["Method", "Transactions", "Revenue (RM)"]],
      body: data.revenueByPaymentMethod.map((m) => [m.method, m.count.toString(), formatRM(m.amount)]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    })

    y = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Top Customers", 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [["Customer", "Bookings", "Total Spend (RM)"]],
      body: data.topCustomers.map((c) => [c.customerName, c.bookingCount.toString(), formatRM(c.totalSpend)]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    })

    y = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Top Vehicles", 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [["Brand", "Model", "Type", "Bookings", "Revenue (RM)"]],
      body: data.topVehicles.map((v) => [v.brand, v.model, v.type, v.bookingCount.toString(), formatRM(v.revenue)]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    })

    doc.save(`rentease-report-${data.startDate}-${data.endDate}.pdf`)
  })
}

function exportExcel(data: ReportSummary) {
  import("xlsx").then(({ utils, writeFile }) => {
    const wb = utils.book_new()

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["RentEase Business Intelligence Report"],
      [`Period: ${data.startDate} to ${data.endDate}`],
      [],
      ["KPI", "Value"],
      ["Total Revenue", data.totalRevenue],
      ["Revenue Growth %", data.revenueGrowthPercent],
      ["Previous Period Revenue", data.previousPeriodRevenue],
      ["Total Bookings", data.totalBookings],
      ["Avg Booking Value", data.averageBookingValue],
      ["Completion Rate %", data.completionRate],
      ["Cancellation Rate %", data.cancellationRate],
      ["Avg Rental Days", data.averageRentalDays],
      ["Avg Lead Time Days", data.averageLeadTimeDays],
    ]), "Summary")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Month", "Revenue (RM)"],
      ...data.revenueByMonth.map((r) => [r.label, r.amount]),
    ]), "Revenue by Month")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Status", "Count"],
      ...data.bookingsByStatus.map((s) => [s.label, s.count]),
    ]), "Bookings by Status")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Day", "Bookings"],
      ...data.bookingsByDayOfWeek.map((d) => [d.label, d.count]),
    ]), "Bookings by Day")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Method", "Transactions", "Revenue (RM)"],
      ...data.revenueByPaymentMethod.map((m) => [m.method, m.count, m.amount]),
    ]), "Payment Methods")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Customer", "Bookings", "Total Spend (RM)"],
      ...data.topCustomers.map((c) => [c.customerName, c.bookingCount, c.totalSpend]),
    ]), "Top Customers")

    utils.book_append_sheet(wb, utils.aoa_to_sheet([
      ["Brand", "Model", "Type", "Bookings", "Revenue (RM)"],
      ...data.topVehicles.map((v) => [v.brand, v.model, v.type, v.bookingCount, v.revenue]),
    ]), "Top Vehicles")

    writeFile(wb, `rentease-report-${data.startDate}-${data.endDate}.xlsx`)
  })
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/_layout/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports" }] }),
})

// ─── Component ───────────────────────────────────────────────────────────────

function ReportsPage() {
  const defaultStart = format(new Date(new Date().setMonth(new Date().getMonth() - 11, 1)), "yyyy-MM-dd")
  const defaultEnd = format(new Date(), "yyyy-MM-dd")

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reports", startDate, endDate],
    queryFn: () => fetchReportSummary(startDate, endDate),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart2 className="h-8 w-8 text-primary" />
          Business Reports
        </h1>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportPDF(data)} className="gap-2">
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(data)} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 py-3">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</Label>
              <Input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">End Date</Label>
              <Input type="date" value={endDate} min={startDate} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && (
        <div className="text-center py-24 text-destructive font-medium">
          Failed to load report data. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* ── Section A: Business Health KPIs ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Revenue */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-black text-foreground">{formatRM(data.totalRevenue)}</span>
                  <GrowthBadge value={data.revenueGrowthPercent} />
                </div>
                {data.previousPeriodRevenue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Prev period: {formatRM(data.previousPeriodRevenue)}</p>
                )}
              </CardContent>
            </Card>

            {/* Total Bookings */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{data.totalBookings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Excl. cancelled & failed</p>
              </CardContent>
            </Card>

            {/* Avg Booking Value */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Booking Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{formatRM(data.averageBookingValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per completed booking</p>
              </CardContent>
            </Card>

            {/* Cancellation Rate */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Cancellation Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RateLabel value={data.cancellationRate} warn={20} good={10} />
                <p className="text-xs text-muted-foreground mt-1">
                  {data.cancellationRate <= 10 ? "Healthy" : data.cancellationRate <= 20 ? "Moderate — monitor trend" : "High — action recommended"}
                </p>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`font-black text-2xl ${data.completionRate >= 70 ? "text-emerald-600" : data.completionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.completionRate.toFixed(1)}%
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.completionRate >= 70 ? "Strong conversion" : "Review booking funnel"}
                </p>
              </CardContent>
            </Card>

            {/* Avg Rental Duration */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Avg Rental Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  {data.averageRentalDays != null ? `${data.averageRentalDays.toFixed(1)} days` : "—"}
                </div>
                {data.averageLeadTimeDays != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg lead time: {data.averageLeadTimeDays.toFixed(1)} days ahead
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Section B: Revenue Analytics ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="text-base font-bold text-primary">Revenue by Month</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.revenueByMonth} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} width={65} />
                    <Tooltip formatter={(v: number) => formatRM(v)} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="text-base font-bold text-primary">Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {data.revenueByPaymentMethod.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No payment data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={data.revenueByPaymentMethod}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        label={({ method, percent }) => percent > 0.05 ? `${method} ${(percent * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                      >
                        {data.revenueByPaymentMethod.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatRM(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Section C: Booking Intelligence ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="text-base font-bold text-primary">Bookings by Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {data.bookingsByStatus.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No booking data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={data.bookingsByStatus}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ label, percent }) => percent > 0.04 ? `${label} ${(percent * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                      >
                        {data.bookingsByStatus.map((entry) => (
                          <Cell key={entry.label} fill={BOOKING_STATUS_COLORS[entry.label] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "Bookings"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="text-base font-bold text-primary">Peak Booking Days</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.bookingsByDayOfWeek} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, "Bookings"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.bookingsByDayOfWeek.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Section D: Bookings by Vehicle Type ── */}
          {data.bookingsByVehicleType.length > 0 && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="text-base font-bold text-primary">Bookings by Vehicle Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.bookingsByVehicleType} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, "Bookings"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.bookingsByVehicleType.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Section E: Top Customers ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.topCustomers.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">No customer data</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right pr-4">Total Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topCustomers.map((c, i) => (
                      <TableRow key={c.customerId}>
                        <TableCell className="pl-4 text-muted-foreground font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{c.customerName}</TableCell>
                        <TableCell className="text-right">{c.bookingCount}</TableCell>
                        <TableCell className="text-right pr-4 font-medium">{formatRM(c.totalSpend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Section G: Top Vehicles ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-base font-bold text-primary">Top Vehicles by Bookings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.topVehicles.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No vehicle data</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">#</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right pr-4">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topVehicles.map((v, i) => (
                      <TableRow key={v.vehicleId}>
                        <TableCell className="pl-4 text-muted-foreground font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{v.brand}</TableCell>
                        <TableCell>{v.model}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{v.type}</span>
                        </TableCell>
                        <TableCell className="text-right">{v.bookingCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-4 font-medium">{formatRM(v.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
