import { auth } from "@/auth"
import { RankingClient } from "@/components/colaboradores/colaboradores-client"

export const metadata = {
  title: "Ranking | GuimiCell OS",
  description: "Ranking de desempenho da equipe Guimicell",
}

export default async function RankingPage() {
  const session = await auth()
  const isSuperUser = (session?.user as any)?.isSuperUser
  const canManageUsers = session?.user?.role === "ADMIN" || isSuperUser

  return <RankingClient canManageUsers={canManageUsers} />
}
