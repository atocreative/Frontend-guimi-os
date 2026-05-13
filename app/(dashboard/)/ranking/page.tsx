import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { RankingPageClient } from "@/components/gamificacao/ranking-page-client"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Ranking",
  description: "Visualize o ranking de gamificação e sua posição",
}

export default async function RankingPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  return <RankingPageClient currentUserId={session.user.id} currentUserRole={session.user.role} />
}
