import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createFileRoute } from "@tanstack/react-router"
import { motion } from "framer-motion"

export const Route = createFileRoute("/_layout/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [
      {
        title: "My Bookings - RentEase",
      },
    ],
  }),
})

const bookings = [
  {
    id: 1,
    carName: "BMW M3 Sport",
    image: "/assets/images/vehicles/grey_sport.png",
    status: "Completed",
    date: "Sep 10, 2023",
    time: "07:30 PM",
    totalCost: 2500,
  },
  {
    id: 2,
    carName: "Audi RS5 Coupe",
    image: "/assets/images/vehicles/grey_sport.png",
    status: "Active",
    date: "Sep 12, 2023",
    time: "10:00 AM",
    totalCost: 3800,
  },
  {
    id: 3,
    carName: "Mercedes AMG GT",
    image: "/assets/images/vehicles/grey_sport.png",
    status: "Booked",
    date: "Oct 05, 2023",
    time: "02:15 PM",
    totalCost: 4500,
  },
  {
    id: 4,
    carName: "Porsche 911 Turbo",
    image: "/assets/images/vehicles/silver_supercar.png",
    status: "Cancelled",
    date: "Aug 25, 2023",
    time: "09:00 AM",
    totalCost: 0,
  },
]

function BookingsPage() {
  const [visibleBookings, setVisibleBookings] = useState(6)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-sky-500/10 text-sky-600 border-sky-200'
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
      case 'booked': return 'bg-amber-500/10 text-amber-600 border-amber-200'
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 border-rose-200'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="text-xl font-bold text-primary">Rental History</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-8 md:grid-cols-2">
            {bookings.slice(0, visibleBookings).map((booking) => (
              <motion.div 
                key={booking.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="flex gap-5 rounded-xl border border-border bg-background p-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* Car Image */}
                <div className="h-28 w-40 flex-shrink-0 overflow-hidden rounded-lg shadow-inner bg-muted">
                  <img 
                    src={booking.image} 
                    alt={booking.carName} 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>

                {/* Booking Details */}
                <div className="flex flex-1 flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">{booking.carName}</h3>
                    <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      Date: <span className="text-foreground/80">{booking.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      Time: <span className="text-foreground/80">{booking.time}</span>
                    </span>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight">
                      Get Details & Receipt
                    </Button>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Total Cost</span>
                      <span className="font-black text-primary text-xl tracking-tight">RM {booking.totalCost}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Show More Button */}
          {visibleBookings < bookings.length && (
            <div className="mt-10 flex justify-center">
              <Button 
                onClick={() => setVisibleBookings(prev => prev + 6)}
                className="bg-primary px-10 h-11 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                View More Bookings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
