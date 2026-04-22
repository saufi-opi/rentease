import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { UserControllerService } from "@/client"
import { AppHeader } from "@/components/Layout/AppHeader"
import AppSidebar from "@/components/Sidebar/AdminSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"
import { queryClient } from "@/lib/react-query"

export const Route = createFileRoute("/admin/_layout")({
  component: Layout,
  beforeLoad: async ({ location }) => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
        search: {
          next: location.pathname,
        },
      })
    }

    let currentUser
    try {
      currentUser = await queryClient.ensureQueryData({
        queryKey: ["currentUser"],
        queryFn: () => UserControllerService.getCurrentUser(),
      })
    } catch {
      throw redirect({
        to: "/login",
        search: {
          next: location.pathname,
        },
      })
    }

    const hasAccess =
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "TOP_MANAGEMENT" ||
      currentUser?.role === "MAINTENANCE"
    if (!hasAccess) {
      throw notFound()
    }

    if (
      currentUser?.role === "MAINTENANCE" &&
      !location.pathname.startsWith("/admin/maintenance")
    ) {
      throw redirect({ to: "/admin/maintenance" })
    }
  },
})

function Layout() {
  const defaultOpen = localStorage.getItem("sidebar-exp") === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full overflow-hidden bg-muted/20">
        <AppSidebar />
        <SidebarInset className="flex flex-col w-full h-full overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <div className="h-full mx-auto flex w-full max-w-[1536px] flex-col p-4">
              <div className="animate-page-enter">
                <Outlet />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default Layout
