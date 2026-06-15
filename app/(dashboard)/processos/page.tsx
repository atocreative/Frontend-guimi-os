import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { ProcessosDashboard } from "@/components/processos/processos-dashboard"

export default async function ProcessosPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const role: string = (session.user as any).role ?? "COLABORADOR"
  const canUpload = ["ADMIN", "GERENTE", "SUPER_USER"].includes(role)

  return (
    <ProcessosDashboard
      userRole={role}
      canUpload={canUpload}
    />
  )
}
