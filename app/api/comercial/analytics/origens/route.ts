import { NextResponse } from "next/server"
import { fetchComercialLeadsRaw, computeAnalytics } from "@/lib/services/comercial-analytics"

export async function GET() {
  try {
    const raw = await fetchComercialLeadsRaw()
    const { origens, totais } = computeAnalytics(raw)
    return NextResponse.json({ origens, totalLeads: totais.totalLeads })
  } catch {
    return NextResponse.json({ origens: [], totalLeads: 0 }, { status: 200 })
  }
}
