import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type NavItemConfig = {
  icon: LucideIcon
  title: string
  path: string
  children?: Omit<NavItemConfig, "children">[]
  exact?: boolean
}

interface NavItemProps {
  item: NavItemConfig
}

export function NavItem({ item }: NavItemProps) {
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const checkIsActive = (path: string, exact?: boolean) => {
    if (path === "/" || exact) return currentPath === path
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleCollapsibleClick = () => {
    if (state === "collapsed") {
      setOpen(true)
    }
  }

  const hasSubItems = item.children?.length
  const isActive = checkIsActive(item.path, item.exact)

  const isChildActive = item.children?.some((child) =>
    checkIsActive(child.path, child.exact),
  )

  if (hasSubItems) {
    return (
      <Collapsible
        asChild
        defaultOpen={isActive || isChildActive}
        className="group/collapsible"
      >
        <SidebarMenuItem className="px-2 group-data-[collapsible=icon]:px-0">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              onClick={handleCollapsibleClick}
              isActive={isActive || isChildActive}
              className="hover:scale-105 cursor-pointer select-none rounded-lg py-5 px-3 transition-all hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:items-center"
            >
              {item.icon && <item.icon className="size-5 shrink-0" />}
              <span className="text-sm group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="ml-4 border-l border-border/50 pl-2 group-data-[collapsible=icon]:hidden">
              {item.children?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(subItem.path, subItem.exact)}
                    className="hover:scale-105 cursor-pointer rounded-md py-4 px-3 text-xs transition-all hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  >
                    <RouterLink to={subItem.path} onClick={handleMenuClick}>
                      {subItem.icon && (
                        <subItem.icon className="size-4 shrink-0" />
                      )}
                      <span>{subItem.title}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem className="px-2 group-data-[collapsible=icon]:px-0">
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isActive}
        asChild
        className="hover:scale-105 cursor-pointer rounded-lg py-5 px-3 transition-all hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:items-center"
      >
        <RouterLink to={item.path} onClick={handleMenuClick}>
          {item.icon && <item.icon className="size-5 shrink-0" />}
          <span className="text-sm group-data-[collapsible=icon]:hidden">
            {item.title}
          </span>
        </RouterLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
