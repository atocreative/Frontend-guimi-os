import { getSession } from "@/lib/auth-session"
import { RankingPageClient } from "@/components/gamificacao/ranking-page-client"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ranking | Guimicell OS",
  description: "Ranking de desempenho dos vendedores",
}

export default async function RankingPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <RankingPageClient
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  )
}
