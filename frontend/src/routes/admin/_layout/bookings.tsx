import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/admin/_layout/bookings")({
  component: AdminBookings,
  head: () => ({
    meta: [
      {
        title: "All Bookings - RentEase Admin",
      },
    ],
  }),
})

function AdminBookings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          Manage Bookings
        </h1>
        <Button variant="outline" className="gap-2 font-bold">
          <Filter className="h-4 w-4" />
          Filter Bookings
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-xl font-bold text-primary">Master Booking List</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-4">
            <ClipboardList className="h-20 w-20 opacity-10" />
            <p className="text-lg">Table view for all system bookings is under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
