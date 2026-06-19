import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { ProcessosDashboard } from "@/components/processos/processos-dashboard"

export default async function ProcessosPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const role: string = (session.user as any).role ?? "COLABORADOR"
  const isSuperUser: boolean = (session.user as any).isSuperUser === true
  const canAccess = isSuperUser || role === "SUPER_USER"
  const canUpload = canAccess

  return (
    <ProcessosDashboard
      userRole={role}
      canUpload={canUpload}
      isBlocked={!canAccess}
    />
  )
}
