"use client"

import { useComercialAnalytics } from "@/hooks/use-comercial-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Info, TrendingUp, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AlertaComercial, PipelineEtapa, VendedorStats, OrigemLead } from "@/lib/services/comercial-analytics"

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 })
const NUM = new Intl.NumberFormat("pt-BR")

const PIPELINE_COLORS: Record<string, string> = {
  novo_contato: "bg-blue-500",
  em_negociacao: "bg-yellow-500",
  proposta_enviada: "bg-orange-500",
  fechado_ganho: "bg-emerald-500",
  fechado_perdido: "bg-red-400",
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
      </CardContent>
    </Card>
  )
}

function AlertaItem({ alerta }: { alerta: AlertaComercial }) {
  const icon = alerta.tipo === "danger"
    ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
    : alerta.tipo === "warning"
    ? <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
    : <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />

  const bg = alerta.tipo === "danger" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
    : alerta.tipo === "warning" ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
    : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"

  return (
    <div className={`flex gap-2 rounded-lg border p-3 ${bg}`}>
      {icon}
      <div>
        <p className="text-xs font-semibold">{alerta.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
      </div>
    </div>
  )
}

function PipelineBar({ etapas }: { etapas: PipelineEtapa[] }) {
  const ativas = etapas.filter((e) => e.etapa !== "fechado_ganho" && e.etapa !== "fechado_perdido")
  return (
    <div className="space-y-2">
      {ativas.map((e) => (
        <div key={e.etapa} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${PIPELINE_COLORS[e.etapa] ?? "bg-gray-400"}`} />
              <span className="font-medium">{e.label}</span>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <span>{e.quantidade} leads</span>
              <span className="font-semibold text-foreground">{BRL.format(e.valor)}</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${PIPELINE_COLORS[e.etapa] ?? "bg-gray-400"} transition-all duration-500`}
              style={{ width: `${e.percentual}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function VendedorRow({ v }: { v: VendedorStats }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
          {v.responsavel.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-medium">{v.responsavel}</p>
          <p className="text-xs text-muted-foreground">{v.total} leads · {v.semFollowUp > 0 ? <span className="text-yellow-600">{v.semFollowUp} sem follow-up</span> : "follow-ups ok"}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{v.taxaConversao}% conv.</p>
        <p className="text-xs text-muted-foreground">{BRL.format(v.valorTotal)}</p>
      </div>
    </div>
  )
}

function OrigemRow({ o, index }: { o: OrigemLead; index: number }) {
  const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500"]
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${COLORS[index % COLORS.length]}`} />
          <span className="font-medium">{o.origem}</span>
        </div>
        <div className="flex gap-2 text-muted-foreground">
          <span>{NUM.format(o.quantidade)} leads</span>
          <span className="font-semibold text-foreground">{o.percentual}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${COLORS[index % COLORS.length]} transition-all`} style={{ width: `${o.percentual}%` }} />
      </div>
    </div>
  )
}

export function AnalyticsPanel() {
  const { analytics, isLoading, hasError, refresh } = useComercialAnalytics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (hasError || !analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Não foi possível carregar os dados analytics.</p>
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { origens, pipeline, vendedores, alertas, totais } = analytics

  return (
    <div className="space-y-4">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Leads", value: NUM.format(totais.totalLeads), sub: `${totais.leadsAtivos} ativos` },
          { label: "Conversão", value: `${totais.taxaConversao}%`, sub: `${totais.leadsGanhos} ganhos` },
          { label: "Volume Pipeline", value: BRL.format(totais.volumePipeline), sub: "leads ativos" },
          { label: "Ticket Médio", value: BRL.format(totais.ticketMedio), sub: "fechados ganhos" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold mt-1">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Pipeline */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Pipeline Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineBar etapas={pipeline} />
            <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ganhos</p>
                <p className="text-sm font-bold text-emerald-600">{pipeline.find(e => e.etapa === "fechado_ganho")?.quantidade ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Perdidos</p>
                <p className="text-sm font-bold text-red-500">{pipeline.find(e => e.etapa === "fechado_perdido")?.quantidade ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Origens */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Origem dos Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {origens.slice(0, 6).map((o, i) => <OrigemRow key={o.origem} o={o} index={i} />)}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Alertas Comerciais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertas.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-4">Nenhum alerta ativo.</p>
              : alertas.map((a, i) => <AlertaItem key={i} alerta={a} />)
            }
          </CardContent>
        </Card>

      </div>

      {/* Vendedores */}
      {vendedores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversão por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {vendedores.map((v) => <VendedorRow key={v.responsavel} v={v} />)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
