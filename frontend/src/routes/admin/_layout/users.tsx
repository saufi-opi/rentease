import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, MoreHorizontal, Search, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAuth from "@/hooks/useAuth"
import { useDebounce } from "@/hooks/useDebounce"
import { getAccessToken } from "@/lib/axios"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export const Route = createFileRoute("/admin/_layout/users")({
  component: AdminUsers,
  head: () => ({
    meta: [{ title: "User Management" }],
  }),
})

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  address: string | null
  role: "CUSTOMER" | "ADMIN" | "TOP_MANAGEMENT" | "MAINTENANCE"
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED"
  created_at: string
  updated_at: string
}

type PageResponse<T> = {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

async function fetchUsers(
  page: number,
  search: string,
  role: string,
  status: string,
): Promise<PageResponse<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), size: "10" })
  if (search) params.set("search", search)
  if (role !== "ALL") params.set("role", role)
  if (status !== "ALL") params.set("status", status)
  const res = await fetch(`${API_BASE}/api/v1/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) throw new Error("Failed to fetch users")
  return res.json()
}

async function updateUser(id: string, body: { role?: string; status?: string }) {
  const res = await fetch(`${API_BASE}/api/v1/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to update user")
  return res.json()
}

async function deleteUser(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) throw new Error("Failed to delete user")
}

const ROLE_BADGE: Record<string, React.ReactNode> = {
  CUSTOMER: <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Customer</Badge>,
  ADMIN: <Badge className="bg-red-500 hover:bg-red-600 text-white">Admin</Badge>,
  TOP_MANAGEMENT: <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Management</Badge>,
  MAINTENANCE: <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Maintenance</Badge>,
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  ACTIVE: <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Active</Badge>,
  INACTIVE: <Badge variant="secondary">Inactive</Badge>,
  PENDING: <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>,
  SUSPENDED: <Badge variant="destructive">Suspended</Badge>,
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function AdminUsers() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()

  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 500)
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [viewUser, setViewUser] = useState<AdminUser | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const PAGE_SIZE = 10

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter, statusFilter],
    queryFn: () => fetchUsers(page, search, roleFilter, statusFilter),
  })

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { role?: string; status?: string } }) =>
      updateUser(id, body),
    onSuccess: () => {
      toast.success("User updated")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setEditUser(null)
    },
    onError: () => toast.error("Failed to update user"),
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setDeleteTarget(null)
    },
    onError: () => toast.error("Failed to delete user"),
  })

  const users = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  function openEdit(user: AdminUser) {
    setEditUser(user)
    setEditRole(user.role)
    setEditStatus(user.status)
  }

  function resetPage() {
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          User Management
        </h1>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                resetPage()
              }}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v)
              resetPage()
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TOP_MANAGEMENT">Management</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              resetPage()
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{ROLE_BADGE[user.role] ?? <Badge variant="outline">{user.role}</Badge>}</TableCell>
                    <TableCell>{STATUS_BADGE[user.status] ?? <Badge variant="outline">{user.status}</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.phone_number || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewUser(user)}>
                            View Details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(user)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            {totalElements > 0
              ? `Showing ${page * PAGE_SIZE + 1} to ${Math.min((page + 1) * PAGE_SIZE, totalElements)} of ${totalElements} users`
              : "No users"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page + 1} / {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <Detail label="Name" value={viewUser.full_name || "—"} />
              <Detail label="Email" value={viewUser.email} />
              <Detail label="Phone" value={viewUser.phone_number || "—"} />
              <Detail label="Address" value={viewUser.address || "—"} />
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground w-24 shrink-0">Role</span>
                {ROLE_BADGE[viewUser.role] ?? viewUser.role}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground w-24 shrink-0">Status</span>
                {STATUS_BADGE[viewUser.status] ?? viewUser.status}
              </div>
              <Detail label="Joined" value={formatDate(viewUser.created_at)} />
              <Detail label="Last Updated" value={formatDate(viewUser.updated_at)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TOP_MANAGEMENT">Management</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              disabled={updating}
              onClick={() =>
                editUser && doUpdate({ id: editUser.id, body: { role: editRole, status: editStatus } })
              }
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.full_name || deleteTarget?.email}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteTarget && doDelete(deleteTarget.id)}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  )
}
