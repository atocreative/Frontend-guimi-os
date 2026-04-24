import { auth } from "@/auth"
import { ColaboradoresClient } from "@/components/colaboradores/colaboradores-client"

export default async function ColaboradoresPage() {
  const session = await auth()
  const canManageUsers = session?.user?.role === "ADMIN"

  return <ColaboradoresClient canManageUsers={canManageUsers} />
}
