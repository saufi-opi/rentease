import { Link, useLocation } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

export function AppHeader() {
  const { user, logout, isAdmin, isManagement } = useAuth()
  const location = useLocation()
  
  // Show sidebar trigger if we are in admin routes
  const showSidebarTrigger = location.pathname.startsWith("/admin")

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {showSidebarTrigger && (
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-all duration-200" />
              <div className="hidden md:flex h-4 w-px bg-border mx-2" />
            </div>
          )}
          
          <Link to="/" className="flex items-center gap-2 transition-all hover:opacity-80">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1"
            >
              <img src="/assets/images/logo.png" alt="RentEase Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-foreground">RentEase</span>
            </motion.div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 flex items-center gap-2 px-2 hover:bg-muted/50 transition-all rounded-full border border-transparent hover:border-border">
                  <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                      {getInitials(user?.full_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <p className="text-xs font-bold leading-none">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{user.email}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(isAdmin || isManagement) && (
                  <>
                    <Link to="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}
                <Link to="/dashboard">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" 
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="bg-primary text-primary-foreground font-bold transition-all duration-300 hover:bg-primary/90 hover:shadow-lg shadow-primary/20">
                  Login / Signup
                </Button>
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}
