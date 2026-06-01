"use client"

import { AlertTriangle, TrendingUp, Clock, Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  useAlertasOperacionais,
  type EstoqueCriticoItem,
  type ReposicaoItem,
  type EstoqueParadoItem,
} from "@/lib/queries/use-alertas-operacionais"

// ─── Constantes ──────────────────────────────────────────────────────────────

const MAX_ROWS = 6           // teto visual por card — evita layout shift
const SKELETON_ROWS = 5      // skeleton com altura próxima do estado real
const ROW_HEIGHT = "h-12"    // altura fixa por linha — anti-shift

// ─── Helpers ─────────────────────────────────────────────────────────────────

const intl = new Intl.NumberFormat("pt-BR")

function formatInt(v: number | null | undefined) {
  return intl.format(Number(v ?? 0))
}

// ─── Skeleton compartilhado ──────────────────────────────────────────────────

function CardSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="h-3">
          <Skeleton className="h-3 w-32" />
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Produto</TableHead>
              <TableHead className="pr-6 text-right">Métrica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i} className={ROW_HEIGHT}>
                <TableCell className="pl-6">
                  <Skeleton className="h-3 w-40" />
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Skeleton className="h-3 w-12 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Empty state padronizado ─────────────────────────────────────────────────

function EmptyRow({ label, span = 2 }: { label: string; span?: number }) {
  return (
    <TableRow className={ROW_HEIGHT}>
      <TableCell
        colSpan={span}
        className="text-center text-xs text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  )
}

// ─── Card 1: Estoque Crítico ─────────────────────────────────────────────────

function EstoqueCriticoCard({ items }: { items: EstoqueCriticoItem[] }) {
  const rows = items.slice(0, MAX_ROWS)
  return (
    <Card className="border-rose-200/40 dark:border-rose-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-rose-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </span>
          Estoque Crítico
        </CardTitle>
        <CardDescription>Produtos com saldo abaixo do mínimo</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Produto</TableHead>
              <TableHead className="pr-6 text-right">Estoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow label="Sem alertas críticos." />
            ) : (
              rows.map((it) => (
                <TableRow key={it.id} className={ROW_HEIGHT}>
                  <TableCell className="pl-6 font-medium truncate max-w-[220px]">
                    {it.produto}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Badge
                      variant="destructive"
                      className={cn(
                        "tabular-nums font-semibold",
                        it.estoque === 0 && "animate-pulse"
                      )}
                    >
                      {formatInt(it.estoque)} un.
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Card 2: Reposição Recomendada ───────────────────────────────────────────

function ReposicaoCard({ items }: { items: ReposicaoItem[] }) {
  const rows = items.slice(0, MAX_ROWS)
  return (
    <Card className="border-amber-200/40 dark:border-amber-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-amber-500/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </span>
          Reposição Recomendada
        </CardTitle>
        <CardDescription>Alta demanda · últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Produto</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="pr-6 text-right">Vendas 30d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow label="Sem recomendações de reposição." span={3} />
            ) : (
              rows.map((it) => (
                <TableRow key={it.id} className={ROW_HEIGHT}>
                  <TableCell className="pl-6 font-medium truncate max-w-[180px]">
                    {it.produto}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatInt(it.estoqueAtual)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      <TrendingUp className="h-3 w-3" />
                      {formatInt(it.vendas30d)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Card 3: Estoque Parado ──────────────────────────────────────────────────

function EstoqueParadoCard({ items }: { items: EstoqueParadoItem[] }) {
  // Premium primeiro — prioridade visual conforme spec
  const sorted = [...items].sort((a, b) => {
    const pa = a.premium ? 1 : 0
    const pb = b.premium ? 1 : 0
    if (pa !== pb) return pb - pa
    return b.diasParado - a.diasParado
  })
  const rows = sorted.slice(0, MAX_ROWS)

  return (
    <Card className="border-slate-200/40 dark:border-slate-800/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-slate-500/10 p-1.5">
            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </span>
          Estoque Parado
        </CardTitle>
        <CardDescription>Zero movimentação · priorização premium</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Produto</TableHead>
              <TableHead className="pr-6 text-right">Dias parado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow label="Nenhum item parado." />
            ) : (
              rows.map((it) => (
                <TableRow
                  key={it.id}
                  className={cn(ROW_HEIGHT, it.premium && "bg-amber-50/40 dark:bg-amber-950/10")}
                >
                  <TableCell className="pl-6 font-medium truncate max-w-[220px]">
                    <span className="inline-flex items-center gap-1.5">
                      {it.premium && (
                        <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                      {it.produto}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {it.premium ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300/60 bg-amber-50/60 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/50 tabular-nums"
                      >
                        {formatInt(it.diasParado)} dias
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatInt(it.diasParado)} dias
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Section principal ───────────────────────────────────────────────────────

export function AlertasOperacionais() {
  const { data, isLoading } = useAlertasOperacionais()

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Alertas Operacionais</h2>
        <p className="text-sm text-muted-foreground">Transformar dados em ação.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading || !data ? (
          <>
            <CardSkeleton title="Estoque Crítico" />
            <CardSkeleton title="Reposição Recomendada" />
            <CardSkeleton title="Estoque Parado" />
          </>
        ) : (
          <>
            <EstoqueCriticoCard items={data.estoqueCritico} />
            <ReposicaoCard items={data.reposicaoRecomendada} />
            <EstoqueParadoCard items={data.estoqueParado} />
          </>
        )}
      </div>
    </section>
  )
}
