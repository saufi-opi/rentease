import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { AppHeader } from "@/components/Layout/AppHeader"
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
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
