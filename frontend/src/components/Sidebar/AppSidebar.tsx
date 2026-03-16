import {
  ClipboardList,
  Home,
  UserCircle,
  Clock,
  LayoutDashboard,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import type { NavItemConfig } from "./NavItem"
import { NavSection } from "./NavSection"
import { User } from "./User"
import { Link } from "@tanstack/react-router"

export function AppSidebar() {
  const { user: currentUser, isAdmin } = useAuth()

  // 1. Admin Menu
  const adminItems: NavItemConfig[] = [
    { icon: LayoutDashboard, title: "Admin Dashboard", path: "/admin" },
    { icon: ClipboardList, title: "All Bookings", path: "/admin/bookings" },
  ]

  // 2. User Menu
  const userItems: NavItemConfig[] = [
    { icon: UserCircle, title: "My Profile", path: "/dashboard" },
    { icon: Clock, title: "Booking History", path: "/bookings" },
    { icon: Home, title: "Back to Home", path: "/" },
  ]

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-r border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarHeader className="px-6 py-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Link to="/" className="flex items-center gap-2 transition-all hover:opacity-80">
          <img src="/assets/images/logo.png" alt="RentEase" className="h-8 w-auto min-w-[32px]" />
          <span className="text-xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">RentEase</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden px-2">
        {/* User Specific Menu */}
        <NavSection label="User Menu" items={userItems} />

        {/* Admin Menu if applicable */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <NavSection label="Administration" items={adminItems} />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
