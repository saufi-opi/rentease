import { Link, useLocation } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Car, Heart, LogOut, User as UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

export function ProfileSidebar() {
  const { user, logout, isAdmin, isManagement, isMaintenance } = useAuth()
  const location = useLocation()

  let navLinks = [
    { name: "My Account", path: "/profile", icon: UserIcon },
    { name: "Favourites", path: "/favourites", icon: Heart },
    { name: "My Bookings", path: "/bookings", icon: Car },
  ]

  if (isAdmin || isManagement || isMaintenance) {
    navLinks = navLinks.filter((link) => link.name === "My Account")
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full md:w-[280px] shrink-0 flex flex-col gap-6 rounded-xl shadow-sm border border-border/50 py-8 px-0"
    >
      {/* Profile Info */}
      <div className="flex flex-col items-center px-6 pb-6 border-b border-border/10">
        <Avatar className="h-24 w-24 border-4 shadow-md relative mb-4">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || "User"}`}
          />
          <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
            {getInitials(user?.full_name || "User")}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold text-foreground">
          {user?.full_name || "User Name"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {user?.email || "user@example.com"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col w-full text-sm font-semibold text-muted-foreground">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path)

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center w-full px-8 py-4 space-x-4 transition-all hover:bg-muted/50 ${
                isActive
                  ? "bg-[#eaf4fc] text-primary border-r-4 border-primary font-bold"
                  : "border-r-4 border-transparent"
              }`}
            >
              <link.icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span>{link.name}</span>
            </Link>
          )
        })}

        {/* Separator before Sign Out */}
        <div className="my-2" />

        <button
          onClick={() => logout()}
          className="flex items-center w-full px-8 py-4 space-x-4 transition-all hover:bg-destructive/10 hover:text-destructive border-r-4 border-transparent text-muted-foreground font-semibold"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </nav>
    </motion.aside>
  )
}
