import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function AccessDeniedPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const isSuperUser = session.user.email === "admin@guimicell.com"

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Acesso Negado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta página não está disponível no momento ou você não tem permissão para acessá-la.
          </p>

          {isSuperUser && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                <strong>Admin:</strong> Você pode habilitar este recurso no{" "}
                <Link href="/super-usuario" className="underline font-medium">
                  Developer Dashboard
                </Link>
                .
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Voltar ao Dashboard</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Código: FEATURE_DISABLED
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
