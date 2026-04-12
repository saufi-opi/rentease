import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/vehicles/$id")({
  component: () => <Outlet />,
})
