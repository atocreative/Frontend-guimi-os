import { NextResponse } from "next/server"
import { fetchComercialLeadsRaw, computeAnalytics } from "@/lib/services/comercial-analytics"

export async function GET() {
  try {
    const raw = await fetchComercialLeadsRaw()
    const { alertas, totais } = computeAnalytics(raw)
    return NextResponse.json({ alertas, totais })
  } catch {
    return NextResponse.json({ alertas: [], totais: null }, { status: 200 })
  }
}
