import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Search, MoreHorizontal, UserCheck, UserX, Mail, Shield,
  Star, Calendar, ArrowUpDown, Download, Filter, Users,
  ChevronDown, RefreshCw, Eye
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

type UserRole = "client" | "expert" | "admin"
type UserStatus = "active" | "suspended" | "pending"
type PayoutStatus = "connected" | "pending_onboarding" | "not_connected"

type PlatformUser = {
  id: string
  name: string
  initials: string
  gradient: string
  email: string
  role: UserRole
  status: UserStatus
  joined: string
  lastActive: string
  bookings: number
  spent: number
  expertRating?: number
  payoutConnected?: boolean
  payoutStatus?: PayoutStatus
}

const roleConfig = {
  client: { color: "text-info", bg: "bg-info/10", label: "Client" },
  expert: { color: "text-primary", bg: "bg-brand-50", label: "Expert" },
  admin: { color: "text-amber-600", bg: "bg-amber-50", label: "Admin" },
}

const statusConfig = {
  active: { color: "text-success", bg: "bg-success/10", label: "Active", dot: "bg-success" },
  suspended: { color: "text-error", bg: "bg-error/10", label: "Suspended", dot: "bg-error" },
  pending: { color: "text-amber-600", bg: "bg-amber-50", label: "Pending", dot: "bg-amber-400" },
}

const payoutStatusConfig: Record<PayoutStatus, { label: string; className: string }> = {
  connected: { label: "Ready", className: "bg-success/10 text-success border-success/20 text-xs" },
  pending_onboarding: { label: "Pending onboarding", className: "bg-warning/10 text-warning border-amber-200 text-xs" },
  not_connected: { label: "Not connected", className: "bg-muted text-muted-foreground border-border text-xs" },
}

export function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setLoading(true)
    api.get("/admin/users")
      .then((res: any) => {
        const mapped = res.map((user: any) => {
          return {
            id: user.id.toString(),
            name: user.name || "Unknown User",
            initials: user.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "U",
            gradient: user.role === "expert" ? "from-violet-500 to-purple-600" : user.role === "operator" || user.role === "admin" ? "from-slate-600 to-slate-800" : "from-blue-500 to-indigo-600",
            email: user.email,
            role: (user.role === "operator" ? "admin" : user.role) as UserRole,
            status: user.status === "active" ? "active" : user.status === "banned" || user.status === "suspended" ? "suspended" : "pending",
            joined: user.joined,
            lastActive: "Today",
            bookings: user.bookings_count || 0,
            spent: user.spent_earned || 0,
            expertRating: user.expert_rating,
            payoutConnected: user.payout_connected,
            payoutStatus: (user.payout_status || (user.payout_connected ? "connected" : "not_connected")) as PayoutStatus
          }
        })
        setItems(mapped)
      })
      .catch((err: any) => {
        toast.error("Failed to load users: " + err.message)
      })
      .finally(() => setLoading(false))
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "suspended" ? "active" : "banned"
      await api.patch(`/admin/users/${id}`, { status: nextStatus })
      toast.success("User status updated successfully")
      loadUsers()
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message)
    }
  }

  const handleMakeAdmin = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { role: "operator" })
      toast.success("User is now an administrator")
      loadUsers()
    } catch (err: any) {
      toast.error("Failed to update role: " + err.message)
    }
  }

  const filtered = items.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchStatus = statusFilter === "all" || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const counts = {
    total: items.length,
    active: items.filter(u => u.status === "active").length,
    experts: items.filter(u => u.role === "expert").length,
    suspended: items.filter(u => u.status === "suspended").length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
            Users & Experts
          </h1>
          <p className="text-sm text-muted-foreground">Manage all platform members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-2">
            <Mail className="h-3.5 w-3.5" /> Invite User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: counts.total, icon: Users, color: "text-primary", bg: "bg-brand-50" },
          { label: "Active", value: counts.active, icon: UserCheck, color: "text-success", bg: "bg-success/10" },
          { label: "Experts", value: counts.experts, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Suspended", value: counts.suspended, icon: UserX, color: "text-error", bg: "bg-error/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Role: {roleFilter === "all" ? "All" : roleConfig[roleFilter].label}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(["all", "client", "expert", "admin"] as const).map(r => (
              <DropdownMenuItem key={r} onClick={() => setRoleFilter(r)}>
                {r === "all" ? "All roles" : roleConfig[r].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Status: {statusFilter === "all" ? "All" : statusConfig[statusFilter].label}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(["all", "active", "suspended", "pending"] as const).map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All statuses" : statusConfig[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedIds.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2 text-error border-error/30">
            <UserX className="h-3.5 w-3.5" /> Suspend {selectedIds.length} selected
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    onChange={e => setSelectedIds(e.target.checked ? filtered.map(u => u.id) : [])}
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Payouts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Bookings</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Spent / Earned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(user => {
                const r = roleConfig[user.role]
                const s = statusConfig[user.status]
                const payout = payoutStatusConfig[user.payoutStatus || (user.payoutConnected ? "connected" : "not_connected")]
                return (
                  <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.includes(user.id) ? "bg-brand-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="accent-primary" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${user.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {user.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${r.bg} ${r.color} border-0 text-xs`}>{r.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        <span className={`text-xs ${s.color}`}>{s.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "expert" ? (
                        <Badge className={payout.className}>
                          {payout.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.joined}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {user.bookings}
                      {user.role === "expert" && user.expertRating && (
                        <div className="flex items-center justify-end gap-1 text-xs text-amber-500 mt-0.5">
                          <Star className="h-3 w-3 fill-current" />{user.expertRating}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {user.role === "client" ? (
                        <span className="text-foreground">${user.spent.toLocaleString()}</span>
                      ) : user.role === "expert" ? (
                        <span className="text-success">Earning</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.lastActive}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Profile</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Mail className="h-4 w-4" /> Send Email</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, user.status)} className={`gap-2 ${user.status === "suspended" ? "text-success" : "text-error"}`}>
                            {user.status === "suspended" ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            {user.status === "suspended" ? "Reactivate" : "Suspend"}
                          </DropdownMenuItem>
                          {user.role !== "admin" && (
                            <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)} className="gap-2 text-primary">
                              <Shield className="h-4 w-4" /> Make Admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {items.length} users</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
