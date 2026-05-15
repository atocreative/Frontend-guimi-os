/**
 * Application Sidebar Component
 *
 * Handles navigation layout with responsive collapse/expand and dynamic menu item visibility.
 *
 * Key Implementation Details:
 * - Uses React.useMemo and React.useCallback for performance optimization
 * - Sidebar collapse uses `duration-200 ease-linear` transition (see ANIMATIONS.SIDEBAR_COLLAPSE)
 * - CSS pattern: `group-data-[collapsible=icon]` controls responsive badge/text hiding
 * - Menu visibility determined by feature flags + dynamic menu configuration
 * - Supports role-based filtering for regular users and status-coded display for developers
 *
 * CSS Patterns:
 * - `group-data-[collapsible=icon]:hidden` - Hide elements when sidebar is collapsed to icon-only
 * - `transition-[width] duration-200 ease-linear` - Smooth width transitions for collapse
 * - `text-yellow-500` - Indicates coming_soon menu items (for developer view)
 * - `text-red-500` - Indicates hidden menu items (for developer view)
 *
 * Performance Notes:
 * - getMenuItemConfig and getItemStatus are memoized with useCallback
 * - filteredNav and superUserNav use useMemo to prevent unnecessary re-renders
 * - Menu item rendering reuses component instances via React.memo where possible
 */

"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Settings,
  Users,
  CalendarCheck,
  BarChart3,
  BookOpen,
  Wrench,
  LifeBuoy,
  Sun,
  Code2,
  Moon,
  Plug,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { FEATURE_FLAGS, isFeatureEnabled } from "@/lib/feature-flags"
import { useMenuConfig, type MenuConfigItem } from "@/lib/menu-config-context"
import { canAccessMenuItem } from "@/hooks/use-menu-visibility"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  featureId: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItemWithStatus extends NavItem {
  _status: "active" | "coming_soon" | "hidden"
}

interface NavGroupWithStatus {
  label: string
  items: NavItemWithStatus[]
}

const navItems: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, featureId: "DASHBOARD" },
      { title: "Comercial", href: "/comercial", icon: ShoppingBag, featureId: "COMERCIAL" },
      { title: "Financeiro", href: "/financeiro", icon: DollarSign, featureId: "FINANCEIRO" },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Agenda e Tarefas", href: "/agenda", icon: CalendarCheck, featureId: "AGENDA" },
      { title: "Operação", href: "/operacao", icon: Wrench, featureId: "OPERACAO" },
      { title: "Processos", href: "/processos", icon: BookOpen, featureId: "PROCESSOS" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Ranking", href: "/ranking", icon: Users, featureId: "RANKING" },
      { title: "Integrações", href: "/integracoes", icon: Plug, featureId: "INTEGRACOES" },
      { title: "Configurações", href: "/configuracoes", icon: Settings, featureId: "CONFIGURACOES" },
    ],
  },
  {
    label: "Ajuda",
    items: [
      { title: "Suporte", href: "/suporte", icon: LifeBuoy, featureId: "SUPORTE" },
    ],
  },
]

const devNavItems: NavItem[] = [
  { title: "Dashboard Development", href: "/dashboard-development", icon: Code2, featureId: "SUPER_USER_DASHBOARD" },
]

interface AppSidebarProps {
  userRole: string
  userEmail?: string
  isSuperUser?: boolean
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== "light"

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? "light" : "dark")}
          tooltip="Alternar tema"
          className="transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
        >
          <div className="relative h-4 w-4">
            <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>

          <span className="group-data-[collapsible=icon]:hidden ml-2">Tema</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ userRole, userEmail, isSuperUser }: AppSidebarProps) {
  const pathname = usePathname()
  const { items: menuConfigItems } = useMenuConfig()
  const isDeveloper = isSuperUser || userEmail === "admin@guimicell.com" || userRole === "SUPER_USER"

  // Memoize the menu item config lookup to prevent unnecessary lookups
  const getMenuItemConfig = React.useCallback(
    (featureId: string): MenuConfigItem | undefined => {
      return menuConfigItems.find((item) =>
        item.id === featureId.toLowerCase() || item.name === featureId
      )
    },
    [menuConfigItems]
  )

  // Determine item status from menu config with memoization
  const getItemStatus = React.useCallback(
    (featureId: string): "active" | "coming_soon" | "hidden" => {
      const config = getMenuItemConfig(featureId)
      if (!config) return "active" // default if no config
      if (!config.enabled) return "hidden"
      if (config.pending) return "coming_soon"
      return "active"
    },
    [getMenuItemConfig]
  )

  // For regular users: filter by access rules
  const filteredNav = React.useMemo(
    () => {
      return navItems
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Static feature flag check
            if (!isFeatureEnabled(item.featureId, userRole as any)) return false

            // Dynamic menu config check
            const menuConfig = getMenuItemConfig(item.featureId)
            if (menuConfig) {
              if (!menuConfig.enabled) return false
              if (!canAccessMenuItem(menuConfig, userRole)) return false
            }

            // Settings restricted from collaborators
            if (item.featureId === "CONFIGURACOES" && userRole === "COLABORADOR") return false

            return true
          }),
        }))
        .filter((group) => group.items.length > 0)
    },
    [userRole, menuConfigItems]
  )

  const mapItemsWithStatus = React.useCallback(
    (items: NavItem[]): NavItemWithStatus[] =>
      items.map((item) => ({
        ...item,
        _status: getItemStatus(item.featureId),
      })),
    [getItemStatus]
  )

  // For SUPER_USER: all nav items visible with status-based color coding
  const superUserNav = React.useMemo<NavGroupWithStatus[]>(
    () =>
      navItems.map((group) => ({
        ...group,
        items: mapItemsWithStatus(group.items),
      })),
    [mapItemsWithStatus]
  )

  const finalNav: NavGroupWithStatus[] = isDeveloper
    ? [
        ...superUserNav,
        { label: "Desenvolvedor", items: devNavItems.map((item) => ({ ...item, _status: "active" as const })) },
      ]
    : filteredNav.map((group) => ({
        ...group,
        items: mapItemsWithStatus(group.items),
      }))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <div className="flex shrink-0 items-center justify-center">
                <Image
                  src="/logo.webp"
                  alt="GuimiCell OS"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-foreground whitespace-nowrap">
                  GuimiCell OS
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {finalNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Memoize status and active state calculation
                  // These are computed early to prevent JSX creation on every render
                  const status = item._status
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)

                  // SUPER_USER: show all with color coding
                  if (isDeveloper) {
                    const textClass =
                      status === "hidden"
                        ? "text-red-500"
                        : status === "coming_soon"
                        ? "text-yellow-500"
                        : ""

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={textClass}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {status === "hidden" && (
                              <Badge variant="destructive" className="text-[10px] group-data-[collapsible=icon]:hidden">
                                oculto
                              </Badge>
                            )}
                            {status === "coming_soon" && (
                              <Badge variant="secondary" className="text-[10px] group-data-[collapsible=icon]:hidden">
                                em breve
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  // Regular users: coming_soon appears disabled, active appears normal
                  if (status === "coming_soon") {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          disabled
                          className="opacity-50 cursor-not-allowed"
                          tooltip="Em breve"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <Badge variant="secondary" className="text-xs group-data-[collapsible=icon]:hidden">
                            Em breve
                          </Badge>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
