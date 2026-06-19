import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { SystemAuditDashboard } from "@/components/admin/system-audit-dashboard"

export const metadata = { title: "Auditoria do Sistema" }

export default async function SystemAuditPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role as string
  if (role !== "SUPER_USER" && role !== "ADMIN") redirect("/access-denied")

  return <SystemAuditDashboard />
}
