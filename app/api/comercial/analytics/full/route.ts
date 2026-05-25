import { NextResponse } from "next/server"
import { fetchComercialLeadsRaw, computeAnalytics } from "@/lib/services/comercial-analytics"

export const revalidate = 60 // Cache por 60s no CDN/Next cache

export async function GET() {
  try {
    const raw = await fetchComercialLeadsRaw()
    const analytics = computeAnalytics(raw)
    return NextResponse.json(analytics, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    })
  } catch {
    return NextResponse.json(
      { origens: [], pipeline: [], vendedores: [], alertas: [], totais: null },
      { status: 200 }
    )
  }
}
