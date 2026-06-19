import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

const DRIFT_WARN     = 2    // %
const DRIFT_CRITICAL = 10   // %

type StatusLevel = "ok" | "degraded" | "down"

export interface AuditKpiRow {
  label:        string
  key:          string
  fn:           number | null
  ma:           number | null
  consolidated: number | null
  drift:        number | null
  status:       "ok" | "warning" | "critical"
}

export interface AuditAlert {
  severity: "critical" | "warning" | "info"
  label:    string
  detail:   string
}

export interface SystemAuditPayload {
  generatedAt: string
  period:      { month: number; year: number }
  sourceType:  string | null
  isStable:    boolean
  health: {
    fn:       { status: StatusLevel; lastSync: string | null; isStable: boolean }
    ma:       { status: StatusLevel; lastSync: string | null; isStable: boolean }
    snapshot: { status: StatusLevel; lastSync: string | null; isStable: boolean }
    overall:  StatusLevel
  }
  kpis:   AuditKpiRow[]
  alerts: AuditAlert[]
}

function driftStatus(drift: number | null): "ok" | "warning" | "critical" {
  if (drift === null) return "ok"
  const abs = Math.abs(drift)
  if (abs >= DRIFT_CRITICAL) return "critical"
  if (abs >= DRIFT_WARN)     return "warning"
  return "ok"
}

function pctDrift(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  if (b === 0) return a === 0 ? 0 : null
  return ((a - b) / Math.abs(b)) * 100
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token   = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const role = (session?.user as any)?.role as string | undefined
  if (role !== "SUPER_USER" && role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const now    = new Date()
  const month1 = req.nextUrl.searchParams.get("month") ?? String(now.getMonth() + 1)
  const year   = req.nextUrl.searchParams.get("year")  ?? String(now.getFullYear())

  const consolidadoRes = await fetch(
    `${BACKEND_URL}/api/financeiro/consolidado?month=${month1}&year=${year}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(12_000) }
  ).catch(() => null)

  const data = consolidadoRes?.ok ? await consolidadoRes.json().catch(() => null) : null

  // ── Health derivation (mirrors /api/financeiro/health) ─────────────────────
  const fnSt      = data?.breakdown?.fn?.sourceType ?? null
  const fnOk      = fnSt === "live" || fnSt === "snapshot"
  const maOk      = (data?.breakdown?.meuAssessor?.count ?? 0) > 0
  const snapOk    = fnSt === "snapshot" || fnSt === "live"

  const health: SystemAuditPayload["health"] = {
    fn:       { status: fnOk ? "ok" : "degraded",   lastSync: data?.breakdown?.fn?.updatedAt ?? null, isStable: fnOk },
    ma:       { status: maOk ? "ok" : "degraded",   lastSync: null,                                    isStable: maOk },
    snapshot: { status: snapOk ? "ok" : "degraded", lastSync: data?.breakdown?.fn?.updatedAt ?? null, isStable: snapOk },
    overall:  fnOk && maOk ? "ok" : "degraded",
  }

  // ── KPI rows ───────────────────────────────────────────────────────────────
  const fn = data?.breakdown?.fn
  const ma = data?.breakdown?.meuAssessor

  const rows: AuditKpiRow[] = [
    {
      label: "Receita Bruta",
      key:   "revenue",
      fn:    fn?.revenue          ?? null,
      ma:    null,
      consolidated: data?.revenue ?? null,
      drift:  pctDrift(data?.revenue ?? null, fn?.revenue ?? null),
      status: "ok",
    },
    {
      label: "Lucro Bruto",
      key:   "grossProfit",
      fn:    fn?.grossProfit      ?? null,
      ma:    null,
      consolidated: data?.grossProfit ?? null,
      drift:  pctDrift(data?.grossProfit ?? null, fn?.grossProfit ?? null),
      status: "ok",
    },
    {
      label: "Lucro Operacional",
      key:   "operationalProfit",
      fn:    fn?.operationalProfit ?? null,
      ma:    null,
      consolidated: data?.operationalProfit ?? null,
      drift:  pctDrift(data?.operationalProfit ?? null, fn?.operationalProfit ?? null),
      status: "ok",
    },
    {
      label: "Lucro Líquido",
      key:   "netProfit",
      fn:    fn?.netProfit        ?? null,
      ma:    null,
      consolidated: data?.netProfit ?? null,
      drift:  pctDrift(data?.netProfit ?? null, fn?.netProfit ?? null),
      status: "ok",
    },
    {
      label: "Desp. Administrativas",
      key:   "adminExpenses",
      fn:    null,
      ma:    ma?.administrativeExpenses ?? null,
      consolidated: data?.administrativeExpenses ?? null,
      drift:  pctDrift(data?.administrativeExpenses ?? null, ma?.administrativeExpenses ?? null),
      status: "ok",
    },
    {
      label: "Impostos (MA)",
      key:   "taxes",
      fn:    null,
      ma:    ma?.taxes ?? null,
      consolidated: data?.taxes ?? null,
      drift:  pctDrift(data?.taxes ?? null, ma?.taxes ?? null),
      status: "ok",
    },
    {
      label: "Desp. Fixas / Burn Rate",
      key:   "fixedExpenses",
      fn:    fn?.netProfit !== undefined ? null : null,
      ma:    null,
      consolidated: data?.fixedExpenses ?? null,
      drift:  null,
      status: "ok",
    },
  ].map((r) => ({ ...r, status: driftStatus(r.drift) }))

  // ── Alerts ─────────────────────────────────────────────────────────────────
  const alerts: AuditAlert[] = []

  if (health.fn.status !== "ok") {
    alerts.push({ severity: "critical", label: "FN sem sincronização", detail: `Status atual: ${health.fn.status}. Dados FN podem estar desatualizados.` })
  }
  if (health.ma.status !== "ok") {
    alerts.push({ severity: "warning", label: "MA sem sincronização", detail: `Nenhuma transação MA encontrada no período.` })
  }
  if (fnSt && fnSt !== "live") {
    alerts.push({ severity: "warning", label: "Fonte não está ao vivo", detail: `sourceType atual: "${fnSt}". Dados podem ser de snapshot histórico.` })
  }

  for (const row of rows) {
    if (row.status === "critical") {
      alerts.push({ severity: "critical", label: `Drift crítico: ${row.label}`, detail: `Divergência de ${row.drift?.toFixed(1)}% entre fonte e consolidado.` })
    } else if (row.status === "warning") {
      alerts.push({ severity: "warning", label: `Drift elevado: ${row.label}`, detail: `Divergência de ${row.drift?.toFixed(1)}% — acima do limiar de ${DRIFT_WARN}%.` })
    }
  }

  const payload: SystemAuditPayload = {
    generatedAt: new Date().toISOString(),
    period:      { month: Number(month1), year: Number(year) },
    sourceType:  fnSt,
    isStable:    health.overall === "ok",
    health,
    kpis:   rows,
    alerts,
  }

  return NextResponse.json(payload)
}
