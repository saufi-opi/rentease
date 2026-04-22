import { Link } from "@tanstack/react-router"
import useAuth from "@/hooks/useAuth"

const ADMIN_ROUTES = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
  },
  {
    to: "/admin/vehicles",
    label: "Vehicles",
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
  },
  {
    to: "/admin/maintenance",
    label: "Maintenance",
  }
]

const CUSTOMER_ROUTES = [
  {
    to: "/",
    label: "Home",
  },
  {
    to: "/vehicles",
    label: "Vehicles",
  },
  {
    to: "/#about",
    label: "About",
  },
  {
    to: "/#contact",
    label: "Contact",
  }
]

export function Navbar() {
  const { isAdmin } = useAuth()

  const routes = isAdmin ? ADMIN_ROUTES : CUSTOMER_ROUTES

  return (
    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
      {
        routes.map((route) => (
          <Link
            key={route.to}
            to={route.to}
            className="text-muted-foreground hover:text-primary transition-colors"
            activeProps={{ className: "text-primary font-bold" }}
            activeOptions={{ exact: true }}
          >
            {route.label}
          </Link>
        ))
      }
    </nav>
  )
}
