import { BarChart2, Car, ClipboardList, LayoutDashboard, Receipt, Wrench } from "lucide-react"

import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import type { NavItemConfig } from "./NavItem"
import { NavSection } from "./NavSection"
export function AdminSidebar() {
  const { isAdmin, isManagement, isMaintenance } = useAuth()

  const adminItems: NavItemConfig[] = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      path: "/admin/dashboard",
    },
    { icon: Car, title: "Vehicles", path: "/admin/vehicles" },
    { icon: Wrench, title: "Maintenance", path: "/admin/maintenance" },
    { icon: ClipboardList, title: "All Bookings", path: "/admin/bookings" },
    { icon: Receipt, title: "Transactions", path: "/admin/transactions" },
    { icon: BarChart2, title: "Reports", path: "/admin/reports" },
  ]

  const maintenanceOnlyItems: NavItemConfig[] = [
    { icon: Wrench, title: "Maintenance", path: "/admin/maintenance" },
  ]

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <SidebarContent className="overflow-x-hidden px-2">
        {(isAdmin || isManagement) && (
          <div className="mt-2 text-sm">
            <NavSection label="System Management" items={adminItems} />
          </div>
        )}
        {isMaintenance && (
          <div className="mt-2 text-sm">
            <NavSection label="Maintenance" items={maintenanceOnlyItems} />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

export default AdminSidebar
