import { HelpCircle, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-all duration-200" />
        <div className="hidden md:flex h-4 w-px bg-border mx-2" />
        
        {/* Global Search Placeholder */}
        <div className="hidden md:flex relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search for cars, bookings..." 
            className="pl-9 h-9 border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Help</span>
        </Button>
      </div>
    </header>
  )
}
