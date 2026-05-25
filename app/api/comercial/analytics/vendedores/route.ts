import { NextResponse } from "next/server"
import { fetchComercialLeadsRaw, computeAnalytics } from "@/lib/services/comercial-analytics"

export async function GET() {
  try {
    const raw = await fetchComercialLeadsRaw()
    const { vendedores, totais } = computeAnalytics(raw)
    return NextResponse.json({ vendedores, totais })
  } catch {
    return NextResponse.json({ vendedores: [], totais: null }, { status: 200 })
  }
}
