import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MenuConfigProvider } from "@/components/super-usuario/menu-config-provider"
import { backendFetch, getSessionAccessToken } from "@/lib/backend-api"
import { normalizeDevMenuItems } from "@/lib/feature-definitions"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const { name, email, role, isSuperUser } = session.user as {
    name: string
    email: string
    role: string
    isSuperUser?: boolean
  }

  // Fetch menu config from backend
  let menuConfig: any[] = []
  const accessToken = getSessionAccessToken(session)
  if (accessToken) {
    try {
      const { response, data } = await backendFetch("/api/dev-menu", { token: accessToken })
      if (response.ok) {
        menuConfig = Array.isArray(data) ? data : (data.data || data.menu || [])
      }
    } catch (error) {
      console.error("Erro ao carregar menu config:", error)
    }
  }

  const normalizedMenu = normalizeDevMenuItems(menuConfig)

  return (
    <MenuConfigProvider initialItems={normalizedMenu}>
      <SidebarProvider>
        <AppSidebar userRole={role} userEmail={email} isSuperUser={isSuperUser} />
        
        {/* O h-screen garante que a área de conteúdo ocupe a tela toda */}
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <Header
            userName={name}
            userEmail={email}
          />
          
          {/* O overflow-y-auto vai apenas nesta main, mantendo header e footer fixos na tela */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background/50">
            <div className="flex flex-col gap-4">
              {children}
            </div>
          </main>

          {/* O Footer agora fica aqui, fora da main, para nunca ser coberto */}
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </MenuConfigProvider>
  )
}
