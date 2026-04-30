import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { FEATURE_FLAGS, FeatureFlag } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FeatureFlagToggle } from "@/components/super-usuario/feature-flag-toggle"

export default async function SuperUsuarioPage() {
  const session = await getSession()
  const userEmail = session?.user?.email

  // Only admin@guimicell.com can access this developer dashboard
  if (userEmail !== "admin@guimicell.com") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Developer Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os Feature Flags e controle quais funcionalidades estão disponíveis no sistema.
        </p>
      </div>

      <div className="grid gap-4">
        {Object.values(FEATURE_FLAGS).map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{flag.name}</CardTitle>
                  <CardDescription className="mt-1">{flag.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {flag.requiredRole && (
                    <Badge variant="secondary" className="text-xs">
                      {flag.requiredRole}
                    </Badge>
                  )}
                  <FeatureFlagToggle flagId={flag.id} initialEnabled={flag.enabled} />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            • Feature flags controlam a disponibilidade de páginas e funcionalidades
          </p>
          <p>
            • Itens desativados aparecem com badge "Em breve" no menu de navegação
          </p>
          <p>
            • Alterações são aplicadas instantaneamente
          </p>
          <p>
            • Note: Nesta versão, as mudanças são apenas em memória (recarregue a página para resetar)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
