import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import { getFinanceiroSummaryServer } from "@/lib/backend-financeiro"

/**
 * BFF — GET /api/financeiro/summary?startDate=...&endDate=...
 * Aceita período opcional via query params.
 * Retorna contrato do backend: { data, count, resumo, grafico, periodo }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const periodo = startDate && endDate ? { startDate, endDate } : undefined

  const summary = await getFinanceiroSummaryServer(token, periodo).catch(() => null)

  if (!summary) {
    return NextResponse.json(
      { error: "FINANCEIRO_SUMMARY_UNAVAILABLE" },
      { status: 502 }
    )
  }

  return NextResponse.json(summary)
}
