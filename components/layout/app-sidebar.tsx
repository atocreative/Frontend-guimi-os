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
      { title: "Colaboradores", href: "/colaboradores", icon: Users, featureId: "COLABORADORES" },
      { title: "Indicadores", href: "/indicadores", icon: BarChart3, featureId: "INDICADORES" },
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
  const { theme, setTheme } = useTheme()

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          tooltip={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className="transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}

          <span className="group-data-[collapsible=icon]:hidden ml-2">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ userRole, userEmail, isSuperUser }: AppSidebarProps) {
  const pathname = usePathname()
  const { items: menuConfigItems } = useMenuConfig()
  const isDeveloper = isSuperUser || userEmail === "admin@guimicell.com" || userRole === "SUPER_USER"

  // Find menu item config by feature ID
  const getMenuItemConfig = (featureId: string): MenuConfigItem | undefined => {
    return menuConfigItems.find((item) =>
      item.id === featureId.toLowerCase() || item.name === featureId
    )
  }

  // Determine item status from menu config
  const getItemStatus = (featureId: string): "active" | "coming_soon" | "hidden" => {
    const config = getMenuItemConfig(featureId)
    if (!config) return "active" // default if no config
    if (!config.enabled) return "hidden"
    if (config.pending) return "coming_soon"
    return "active"
  }

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

  // For SUPER_USER: all nav items visible with status-based color coding
  const superUserNav = React.useMemo(
    () => navItems.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        _status: getItemStatus(item.featureId),
      })),
    })),
    [menuConfigItems]
  )

  const finalNav = isDeveloper
    ? [
      ...superUserNav,
      { label: "Desenvolvedor", items: devNavItems.map(i => ({ ...i, _status: "active" as const })) },
    ]
    : filteredNav.map(g => ({
      ...g,
      items: g.items.map(i => ({ ...i, _status: getItemStatus(i.featureId) })),
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
                  const status = (item as any)._status as "active" | "coming_soon" | "hidden"
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
                              <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded group-data-[collapsible=icon]:hidden">
                                oculto
                              </span>
                            )}
                            {status === "coming_soon" && (
                              <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded group-data-[collapsible=icon]:hidden">
                                em breve
                              </span>
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
                          <span className="ml-auto text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium group-data-[collapsible=icon]:hidden">
                            Em breve
                          </span>
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
