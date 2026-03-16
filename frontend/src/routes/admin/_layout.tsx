import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { AppHeader } from "@/components/Layout/AppHeader"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"
import { queryClient } from "@/lib/react-query"
import { UserResponse } from "@/client"

export const Route = createFileRoute("/admin/_layout")({
  component: Layout,
  beforeLoad: ({ location }) => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
        search: {
          next: location.pathname,
        },
      })
    }

    const currentUser = queryClient.getQueryData<UserResponse>(["currentUser"])
    if (!currentUser?.roles?.includes("ADMIN")) {
      throw redirect({
        to: "/",
      })
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
