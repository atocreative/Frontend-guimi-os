import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import { getFinanceiroSummaryServer } from "@/lib/backend-financeiro"

/**
 * BFF — GET /api/financeiro/summary
 * Proxy para getFinanceiroSummaryServer, retornando o contrato do backend:
 * { data, count, resumo, grafico, periodo }
 */
export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const summary = await getFinanceiroSummaryServer(token).catch(() => null)

  if (!summary) {
    return NextResponse.json(
      { error: "FINANCEIRO_SUMMARY_UNAVAILABLE" },
      { status: 502 }
    )
  }

  return NextResponse.json(summary)
}
