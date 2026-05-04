import { redirect } from "next/navigation"
import { Info } from "lucide-react"
import { getSession } from "@/lib/auth-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeveloperMenuEnhanced } from "@/components/super-usuario/developer-menu-enhanced"
import { backendFetch, getSessionAccessToken } from "@/lib/backend-api"
import { normalizeDevMenuItems } from "@/lib/feature-definitions"

export default async function DashboardDevelopmentPage() {
  const session = await getSession()
  const isSuperUser = (session?.user as any)?.isSuperUser
  const accessToken = getSessionAccessToken(session)

  if (!isSuperUser) {
    redirect("/")
  }

  let rawMenu: any[] = []
  if (accessToken) {
    try {
      const { response, data } = await backendFetch("/api/dev-menu", { token: accessToken })
      if (response.ok) {
        rawMenu = Array.isArray(data) ? data : (data.data || data.menu || [])
      }
    } catch {
      // fail safe — use defaults
    }
  }

  // Always normalize so cards have names even if backend is empty
  const devMenu = normalizeDevMenuItems(rawMenu)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Development</h2>
        <p className="text-sm text-muted-foreground">
          Controle de Feature Flags — alterações refletem no menu e nas rotas em tempo real.
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
              <li>• <span className="font-medium">Ativo</span> — Item visível e funcional</li>
              <li>• <span className="font-medium">Em Breve</span> — Visível mas desativado</li>
              <li>• <span className="font-medium">Oculto</span> — Não aparece no menu</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Visibilidade por Role:</p>
            <ul className="space-y-1 ml-4">
              <li>• Roles vazias = visível para todos</li>
              <li>• Salvar envia ao backend e atualiza o localStorage</li>
              <li>• SUPER_USER sempre vê tudo (com indicador de status)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
