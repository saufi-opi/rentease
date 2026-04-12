import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AppHeader } from "@/components/Layout/AppHeader"
import { ProfileSidebar } from "@/components/Layout/ProfileSidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
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
  },
})

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      <AppHeader />
      <div className="container mx-auto flex flex-col md:flex-row flex-1 py-10 px-4 md:px-6 gap-8">
        <ProfileSidebar />
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
