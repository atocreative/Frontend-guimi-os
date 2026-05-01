import { auth } from "@/auth"
import { ColaboradoresClient } from "@/components/colaboradores/colaboradores-client"

export default async function ColaboradoresPage() {
  const session = await auth()
  const isSuperUser = (session?.user as any)?.isSuperUser
  const canManageUsers = session?.user?.role === "ADMIN" || isSuperUser

  return <ColaboradoresClient canManageUsers={canManageUsers} />
}
