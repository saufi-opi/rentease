import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { NavItem, type NavItemConfig } from "./NavItem"

interface NavSectionProps {
  label: string
  items: NavItemConfig[]
}

export function NavSection({ label, items }: NavSectionProps) {
  return (
    <SidebarGroup className="px-2 group-data-[collapsible=icon]:px-0">
      <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
