import { NextResponse } from "next/server"
import { fetchComercialBI } from "@/lib/services/comercial-bi"

export async function GET() {
  try {
    const bi = await fetchComercialBI()
    return NextResponse.json(bi, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    })
  } catch {
    return NextResponse.json({ error: "BI_UNAVAILABLE" }, { status: 200 })
  }
}
