import { getSession } from "@/lib/auth-session"
import { RankingPageClient } from "@/components/gamificacao/ranking-page-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

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
