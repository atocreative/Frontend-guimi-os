import { redirect } from "next/navigation"
import { Info } from "lucide-react"
import { getSession } from "@/lib/auth-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeveloperMenuEnhanced } from "@/components/super-usuario/developer-menu-enhanced"
import { MenuConfigProvider } from "@/components/super-usuario/menu-config-provider"
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
    <MenuConfigProvider initialItems={devMenu}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Developer Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os Feature Flags e controle quais funcionalidades estão disponíveis no sistema.
          </p>
        </div>

        <DeveloperMenuEnhanced initialMenu={devMenu} isSuperUser={isSuperUser} />

        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <CardTitle className="text-base">Guia de Funcionalidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-2">Estados do Menu:</p>
              <ul className="space-y-1 ml-4">
                <li>• <span className="font-medium">Ativo</span> - Item visível e funcional</li>
                <li>• <span className="font-medium">Em Breve</span> - Visível mas desativado</li>
                <li>• <span className="font-medium">Oculto</span> - Não aparece no menu (vermelho)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Visibilidade por Role:</p>
              <ul className="space-y-1 ml-4">
                <li>• Selecione quais roles podem acessar cada funcionalidade</li>
                <li>• Alterações são salvas localmente e no servidor</li>
                <li>• Use "Restaurar" para desfazer todas as mudanças</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MenuConfigProvider>
  )
}
