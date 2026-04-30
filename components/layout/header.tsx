"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
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
  "/suporte": "Área de Suporte",
}

interface HeaderProps {
  userName: string
  userEmail: string
}

export function Header({ userName, userEmail }: HeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? "Guimicell OS"
  
  // Remove role/category from userName if present (e.g., "Gui ADMIN" -> "Gui")
  const displayName = userName
    .split(" ")
    .filter((part) => !["ADMIN", "COLABORADOR", "GERENTE", "GESTOR"].includes(part.toUpperCase()))
    .join(" ")
    .trim()
  
  const initials = displayName
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
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{displayName}</span>
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
