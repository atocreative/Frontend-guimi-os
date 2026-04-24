import { Plug, Settings2, Users } from "lucide-react"
import { auth } from "@/auth"
import { IntegracaoCard } from "@/components/configuracoes/integracao-card"
import { SistemaCard } from "@/components/configuracoes/sistema-card"
import { UsuariosSection } from "@/components/configuracoes/usuarios-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  mockIntegracoes,
  mockSistema,
} from "./data/mock"

export default async function ConfiguracoesPage() {
  const session = await auth()
  const canManageUsers = session?.user?.role === "ADMIN"

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
          <UsuariosSection canManageUsers={canManageUsers} />
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-4 outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Conectores e APIs</h3>
              <p className="text-sm text-muted-foreground">
                Integrações ativas e configuradas no sistema.
              </p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {mockIntegracoes.filter((integracao) => integracao.status === "CONECTADO").length}/
              {mockIntegracoes.length} conectadas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockIntegracoes.map((integracao) => (
              <IntegracaoCard key={integracao.id} integracao={integracao} />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            As integrações seguem mockadas nesta fase enquanto as APIs externas são validadas.
          </p>
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
