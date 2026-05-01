import { redirect } from "next/navigation"
import { Plug, Settings2, Users } from "lucide-react"
import { auth } from "@/auth"
import { SistemaCard } from "@/components/configuracoes/sistema-card"
import { UsuariosSection } from "@/components/configuracoes/usuarios-section"
import { IntegracaoCard } from "@/components/configuracoes/integracao-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockSistema, mockIntegracoes } from "@/app/(dashboard)/configuracoes/data/mock"
import { checkIntegrationHealth } from "@/lib/integration-checker"

export default async function ConfiguracoesPage() {
  const session = await auth()
  const role = session?.user?.role
  const isSuperUser = (session?.user as any)?.isSuperUser

  // Only allow ADMIN, SUPER_USER role, or isSuperUser flag
  const isAllowed = role === "ADMIN" || role === "SUPER_USER" || isSuperUser === true

  if (!isAllowed || !role) {
    redirect("/")
  }

  const canManageUsers = true // Both admin and super user can manage

  // Check integration health status
  const integracaoComStatus = await Promise.all(
    mockIntegracoes.map(async (integracao) => {
      let status: "CONECTADO" | "DESCONECTADO" | "ERRO" | "PENDENTE" = "PENDENTE"
      let ultimaSincronizacao = null

      try {
        // All integrations are checked via backend, not direct external calls
        // Check backend health which includes Fone Ninja status
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const health = await checkIntegrationHealth(backendUrl, 3000)

        if (health.isHealthy) {
          // Backend is healthy, integrations depend on backend configuration
          status = "CONECTADO"
          ultimaSincronizacao = new Date().toLocaleString("pt-BR")
        } else {
          status = "DESCONECTADO"
        }
      } catch (error) {
        status = "ERRO"
      }

      return {
        ...integracao,
        status,
        ultimaSincronizacao,
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Gerenciamento de usuários, integrações e sistema.
        </p>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2">
            <Plug className="h-4 w-4" />
            <span>Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 outline-none">
          <UsuariosSection canManageUsers={canManageUsers} currentUserRole={role} />
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-4 outline-none">
          <div>
            <h3 className="text-lg font-medium">Conectores e APIs</h3>
            <p className="text-sm text-muted-foreground">
              Status em tempo real das integrações com sistemas externos.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integracaoComStatus.map((integracao) => (
              <IntegracaoCard key={integracao.id} integracao={integracao} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 outline-none">
          <div>
            <h3 className="text-lg font-medium">Informações do Sistema</h3>
            <p className="text-sm text-muted-foreground">
              Detalhes técnicos e versão da plataforma.
            </p>
          </div>
          <div className="max-w-md">
            <SistemaCard sistema={mockSistema} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
