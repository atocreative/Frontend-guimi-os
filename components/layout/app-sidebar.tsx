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
  { title: "Developer Dashboard", href: "/super-usuario", icon: Code2, featureId: "SUPER_USER_DASHBOARD" },
]

interface AppSidebarProps {
  userRole: string
  userEmail?: string
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === "dark" || resolvedTheme === "dark"

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? "light" : "dark")}
          tooltip={isDark ? "Modo claro" : "Modo escuro"}
        >
          <Sun className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ userRole, userEmail }: AppSidebarProps) {
  const pathname = usePathname()
  const isDeveloper = userEmail === "admin@guimicell.com"

  const filteredNav = React.useMemo(
    () =>
      navItems
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Check feature flag is enabled
            if (!isFeatureEnabled(item.featureId, userRole as any)) {
              return false
            }
            // Hide settings from collaborators
            if (item.featureId === "CONFIGURACOES" && userRole === "COLABORADOR") {
              return false
            }
            return true
          }),
        }))
        .filter((group) => group.items.length > 0),
    [userRole]
  )

  const finalNav = isDeveloper
    ? [
        ...filteredNav,
        {
          label: "Desenvolvedor",
          items: devNavItems,
        },
      ]
    : filteredNav

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  <Image
                    src="/logo.webp"
                    alt="GuimiCell OS"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold">GuimiCell OS</span>
                  <span className="text-xs">v0.1.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
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
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)

                  const isDisabled = !isFeatureEnabled(item.featureId, userRole as any)

                  if (isDisabled) {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          disabled
                          className="opacity-40 cursor-not-allowed"
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
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">
            GuimiCell OS · 2026
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
