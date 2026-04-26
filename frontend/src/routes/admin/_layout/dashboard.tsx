import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  AlertTriangle,
  BarChart2,
  Car,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAccessToken } from "@/lib/axios"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

type MonthlyDataPoint = { year: number; month: number; label: string; amount: number }
type StatusCount = { label: string; count: number }

type DashboardStats = {
  totalUsers: number
  activeFleet: number
  todaysBookings: number
  monthlyRevenue: number
  totalRevenue: number
  revenueGrowthPercent: number | null
  averageBookingValue: number
  cancellationRate: number
  newUsersThisMonth: number
  pendingBookingsCount: number
  revenueByMonth: MonthlyDataPoint[]
  bookingsByStatus: StatusCount[]
  vehiclesByStatus: StatusCount[]
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/v1/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) throw new Error("Failed to fetch dashboard stats")
  return res.json()
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  ACTIVE: "#10b981",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
  PAYMENT_FAILED: "#dc2626",
}

const VEHICLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#10b981",
  BOOKED: "#3b82f6",
  UNDER_MAINTENANCE: "#f59e0b",
}

export const Route = createFileRoute("/admin/_layout/dashboard")({
  component: AdminDashboard,
  head: () => ({
    meta: [{ title: "Dashboard" }],
  }),
})

function formatRM(value: number) {
  return `RM ${Number(value).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function GrowthBadge({ value }: { value: number | null }) {
  if (value == null) return null
  const positive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: fetchDashboardStats,
  })

  const cancellationRateHigh = (stats?.cancellationRate ?? 0) > 15

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Dashboard Overview
        </h1>
      </div>

      {/* KPI cards — 3 per row on desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Users */}
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Users className="h-5 w-5 text-blue-600" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoading ? "…" : stats?.totalUsers.toLocaleString()}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                {stats.newUsersThisMonth} new this month
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Fleet */}
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Fleet</CardTitle>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : <Car className="h-5 w-5 text-emerald-600" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoading ? "…" : stats?.activeFleet.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total vehicles in system</p>
          </CardContent>
        </Card>

        {/* Today's Bookings */}
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Today's Bookings</CardTitle>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : <ClipboardList className="h-5 w-5 text-amber-600" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoading ? "…" : stats?.todaysBookings.toLocaleString()}
            </div>
            {stats && stats.pendingBookingsCount > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {stats.pendingBookingsCount} pending approval
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Monthly Revenue</CardTitle>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <TrendingUp className="h-5 w-5 text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground flex items-center gap-2 flex-wrap">
              {isLoading ? "…" : formatRM(stats?.monthlyRevenue ?? 0)}
              {!isLoading && <GrowthBadge value={stats?.revenueGrowthPercent ?? null} />}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatRM(stats.totalRevenue)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Avg Booking Value */}
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Avg Booking Value</CardTitle>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-violet-600" /> : <BarChart2 className="h-5 w-5 text-violet-600" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoading ? "…" : formatRM(stats?.averageBookingValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per completed booking</p>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card className={`border shadow-sm hover:shadow-md transition-shadow ${cancellationRateHigh ? "border-red-200" : "border-border"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cancellation Rate</CardTitle>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-red-500" />
            ) : (
              <AlertTriangle className={`h-5 w-5 ${cancellationRateHigh ? "text-red-500" : "text-muted-foreground"}`} />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${cancellationRateHigh ? "text-red-600" : "text-foreground"}`}>
              {isLoading ? "…" : `${stats?.cancellationRate?.toFixed(1) ?? "0.0"}%`}
            </div>
            <p className={`text-xs mt-1 ${cancellationRateHigh ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              {cancellationRateHigh ? "High — review cancellation reasons" : "All-time cancellation rate"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-base font-bold text-primary">Revenue Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.revenueByMonth ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} width={60} />
                  <Tooltip formatter={(v: number) => formatRM(v)} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-base font-bold text-primary">Bookings by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.bookingsByStatus ?? []}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={({ label, percent }) => percent > 0.05 ? `${label} ${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {(stats?.bookingsByStatus ?? []).map((entry) => (
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
      </div>

      {/* Vehicle availability */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold text-primary">Vehicle Availability</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.vehiclesByStatus ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, "Vehicles"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats?.vehiclesByStatus ?? []).map((entry) => (
                    <Cell key={entry.label} fill={VEHICLE_STATUS_COLORS[entry.label] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
