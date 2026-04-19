import { Car, ClipboardList, LayoutDashboard, Receipt, Wrench } from "lucide-react"

import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import type { NavItemConfig } from "./NavItem"
import { NavSection } from "./NavSection"
export function AdminSidebar() {
  const { isAdmin, isManagement } = useAuth()

  // 1. Admin Menu
  const adminItems: NavItemConfig[] = [
    {
      icon: LayoutDashboard,
      title: "Admin Dashboard",
      path: "/admin/dashboard",
    },
    { icon: Car, title: "Vehicles", path: "/admin/vehicles" },
    { icon: Wrench, title: "Maintenance", path: "/admin/maintenance" },
    { icon: ClipboardList, title: "All Bookings", path: "/admin/bookings" },
    { icon: Receipt, title: "Transactions", path: "/admin/transactions" },
  ]

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <SidebarContent className="overflow-x-hidden px-2">
        {/* Management & Admin Menu */}
        {(isAdmin || isManagement) && (
          <div className="mt-2 text-sm">
            <NavSection label="Admin & Management" items={adminItems} />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

export default AdminSidebar
