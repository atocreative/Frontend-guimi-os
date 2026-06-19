"use client"

import { Archive, DollarSign, Info, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOperationDashboard } from "@/lib/queries/use-operation-dashboard"

const EM_BREVE = "Em breve"

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)

function safeNum(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v === 0) return null
  return v
}

function formatRelativeTime(syncedAt: string | null): string | null {
  if (!syncedAt) return null
  const diff = Date.now() - new Date(syncedAt).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "agora"
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
  tooltip,
  stale,
  syncedAt,
}: {
  icon: React.ElementType
  label: string
  value: string
  loading: boolean
  tooltip?: string
  stale?: boolean
  syncedAt?: string | null
}) {
  const unavailable = value === EM_BREVE
  const relativeTime = formatRelativeTime(syncedAt ?? null)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Sobre ${label}`}
                    className="rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors focus:outline-none"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] whitespace-pre-line text-xs leading-snug">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32 rounded" />
        ) : (
          <>
            <p className={`text-2xl font-bold tabular-nums ${unavailable ? "text-muted-foreground/50 text-base" : ""}`}>
              {value}
            </p>
            {stale && relativeTime && (
              <p className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
                <Clock className="h-2.5 w-2.5" />
                Dados em cache · atualizado {relativeTime}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface Props {
  showFinancial: boolean
}

export function OperacaoCards({ showFinancial }: Props) {
  const now = new Date()
  const { data, isLoading } = useOperationDashboard(now.getMonth() + 1, now.getFullYear())

  const loading = isLoading && !data
  const inv = data?.inventory

  const qtdItens = safeNum(inv?.totalQuantity)
  const valorEstoque = safeNum(inv?.totalValue)

  const kpiQtd = loading
    ? "…"
    : qtdItens !== null
    ? qtdItens.toLocaleString("pt-BR")
    : EM_BREVE

  const kpiValor = loading
    ? "…"
    : valorEstoque !== null
    ? formatBRL(valorEstoque)
    : EM_BREVE

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <KpiCard
        icon={Archive}
        label="Quantidade em Estoque"
        value={kpiQtd}
        loading={loading}
        stale={inv?.stale}
        syncedAt={inv?.syncedAt}
        tooltip={"O que é: Total de itens cadastrados e disponíveis no estoque ativo da loja.\n\nOrigem: Fone Ninja.\n\nAtualização: Sincronização automática diária."}
      />
      {showFinancial && (
        <KpiCard
          icon={DollarSign}
          label="Valor em Estoque"
          value={kpiValor}
          loading={loading}
          stale={inv?.stale}
          syncedAt={inv?.syncedAt}
          tooltip={"O que é: Valor financeiro total dos produtos em estoque, baseado no custo de aquisição de cada item.\n\nOrigem: Fone Ninja.\n\nAtualização: Sincronização automática diária."}
        />
      )}
    </div>
  )
}
