import { redirect } from "next/navigation"
import { Info } from "lucide-react"
import { getSession } from "@/lib/auth-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeveloperMenuClient } from "@/components/super-usuario/developer-menu-client"
import { backendFetch, getSessionAccessToken } from "@/lib/backend-api"

export default async function SuperUsuarioPage() {
  const session = await getSession()
  const userEmail = session?.user?.email
  const isSuperUser = (session?.user as any)?.isSuperUser
  const accessToken = getSessionAccessToken(session)

  // Only ADMIN and SUPER_USER can access this developer dashboard
  if (userEmail !== "admin@guimicell.com" && !isSuperUser) {
    redirect("/")
  }

  // Fetch dev menu from backend using backendFetch
  let devMenu: any[] = []
  if (accessToken) {
    try {
      const { response, data } = await backendFetch("/api/dev-menu", { token: accessToken })
      if (response.ok) {
        devMenu = Array.isArray(data) ? data : (data.data || data.menu || [])
      } else {
        console.error("Erro ao carregar dev menu:", response.status, data)
      }
    } catch (error) {
      console.error("Erro ao carregar dev menu:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Developer Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os Feature Flags e controle quais funcionalidades estão disponíveis no sistema.
        </p>
      </div>

      <DeveloperMenuClient initialMenu={devMenu} />

      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <CardTitle className="text-base">Informações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            • Menu items controlam a disponibilidade de páginas e funcionalidades
          </p>
          <p>
            • Itens ocultados não aparecem no menu de navegação
          </p>
          <p>
            • Itens com "Em breve" aparecem desativados
          </p>
          <p>
            • Clique em "Salvar" para persistir as alterações no backend
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
