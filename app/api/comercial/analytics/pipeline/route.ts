import { NextResponse } from "next/server"
import { fetchComercialLeadsRaw, computeAnalytics } from "@/lib/services/comercial-analytics"

export async function GET() {
  try {
    const raw = await fetchComercialLeadsRaw()
    const { pipeline, totais } = computeAnalytics(raw)
    return NextResponse.json({ pipeline, totais })
  } catch {
    return NextResponse.json({ pipeline: [], totais: null }, { status: 200 })
  }
}
