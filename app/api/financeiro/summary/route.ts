import { NextRequest, NextResponse } from "next/server"

/**
 * DEPRECATED — no longer in use.
 * All financeiro summary data flows through /api/dashboard/summary → /api/financeiro/db/summary.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: "ENDPOINT_DEPRECATED", message: "Use /api/dashboard/summary instead" },
    { status: 410 }
  )
}
