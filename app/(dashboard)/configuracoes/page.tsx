import { redirect } from "next/navigation"
import { Settings2, Users } from "lucide-react"
import { auth } from "@/auth"
import { UsuariosSection } from "@/components/configuracoes/usuarios-section"
import { SistemaSection } from "@/components/configuracoes/sistema-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ConfiguracoesPage() {
  const session = await auth()
  const role = session?.user?.role
  const isSuperUser = (session?.user as any)?.isSuperUser

  const isAllowed = role === "ADMIN" || role === "SUPER_USER" || isSuperUser === true

  if (!isAllowed || !role) {
    redirect("/")
  }

  const canManageUsers = true

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
          <TabsTrigger value="sistema" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 outline-none">
          <UsuariosSection canManageUsers={canManageUsers} currentUserRole={role} />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 outline-none">
          <SistemaSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
