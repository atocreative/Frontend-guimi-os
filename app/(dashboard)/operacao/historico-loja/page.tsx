"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { StoreOperation, StoreHistoryResponse } from "@/types/store-operation"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m}min` : `${h}h ${String(m).padStart(2, "0")}min`
}

function OperationRow({ op }: { op: StoreOperation }) {
  const isComplete = !!op.closedAt
  const isAlert = op.status === "ABERTA_COM_ALERTA" || op.status === "FECHADA_COM_ALERTA"

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Date header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDate(op.openedAt)}
        </div>
        <div className="flex items-center gap-2">
          {isAlert && (
            <Badge variant="outline" className="h-5 text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/5">
              Alerta
            </Badge>
          )}
          {isComplete ? (
            <Badge variant="outline" className="h-5 text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
              Finalizado
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 text-[10px] border-blue-500/40 text-blue-600 bg-blue-500/5">
              Em aberto
            </Badge>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {/* Abertura */}
        <div className="bg-card px-4 py-3 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Abertura</p>
          <p className="text-sm font-semibold tabular-nums">{formatTime(op.openedAt)}</p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="text-xs truncate">{op.openedBy.name}</span>
          </div>
        </div>

        {/* Fechamento */}
        <div className="bg-card px-4 py-3 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Fechamento</p>
          {op.closedAt ? (
            <>
              <p className="text-sm font-semibold tabular-nums">{formatTime(op.closedAt)}</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="text-xs truncate">{op.closedBy?.name ?? "—"}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Aberta</p>
              <p className="text-xs text-muted-foreground">até o momento</p>
            </>
          )}
        </div>

        {/* Duração */}
        <div className="bg-card px-4 py-3 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Duração</p>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">{formatDuration(op.durationMinutes)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isComplete ? "Total operacional" : "Em andamento"}
          </p>
        </div>

        {/* Status */}
        <div className="bg-card px-4 py-3 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isAlert ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            <p className="text-sm font-medium">
              {isAlert ? "Com alerta" : isComplete ? "Encerrado" : "Aberto"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-muted/30">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card px-4 py-3 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistoricoLojaPage() {
  const [operations, setOperations] = useState<StoreOperation[]>([])
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/store/history?page=${page}&perPage=20`, { cache: "no-store" })
      if (res.ok) {
        const data: StoreHistoryResponse = await res.json()
        setOperations(data.data ?? [])
        setPagination(data.pagination)
      }
    } catch {
      setOperations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(1)
  }, [fetchHistory])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/operacao">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Histórico Operacional</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Carregando..." : `${pagination.total} registro(s) de abertura e fechamento`}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : operations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma operação registrada.</p>
          </div>
        ) : (
          operations.map((op) => <OperationRow key={op.id} op={op} />)
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchHistory(pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchHistory(pagination.page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
