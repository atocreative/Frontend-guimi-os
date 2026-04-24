"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/comercial": "Comercial",
  "/financeiro": "Financeiro",
  "/operacao": "Operação",
  "/agenda": "Agenda e Tarefas",
  "/processos": "Processos",
  "/colaboradores": "Colaboradores",
  "/indicadores": "Indicadores",
  "/configuracoes": "Configurações",
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  COLABORADOR: "Colaborador",
}

interface HeaderProps {
  userName: string
  userEmail: string
  userRole: string
}

export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? "Guimicell OS"
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-sm font-semibold">{title}</h1>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-zinc-900 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block">
                {userName}
              </span>
              <Badge variant="secondary" className="text-xs hidden md:block">
                {roleLabels[userRole] ?? userRole}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
