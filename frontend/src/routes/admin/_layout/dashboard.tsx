import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, Car, ClipboardList, TrendingUp } from "lucide-react"

export const Route = createFileRoute("/admin/_layout/dashboard")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      {
        title: "Admin Dashboard - RentEase",
      },
    ],
  }),
})

function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "1,248", icon: Users, color: "text-blue-600" },
    { title: "Active Fleet", value: "84", icon: Car, color: "text-emerald-600" },
    { title: "Today's Bookings", value: "12", icon: ClipboardList, color: "text-amber-600" },
    { title: "Monthly Revenue", value: "₹ 4,25,000", icon: TrendingUp, color: "text-primary" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Admin Overview
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-xl font-bold text-primary">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <ClipboardList className="h-16 w-16 opacity-20" />
            <p className="text-lg font-medium">Activity logs will appear here as the system grows.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
