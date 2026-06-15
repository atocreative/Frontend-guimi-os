"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Store, Clock } from "lucide-react"
import type { StoreStatusResponse } from "@/types/store-operation"

function formatDuration(openedAt: string): string {
  const diff = Date.now() - new Date(openedAt).getTime()
  const totalMins = Math.floor(diff / 60_000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours === 0) return `${mins}min`
  return `${hours}h ${String(mins).padStart(2, "0")}min`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

/**
 * Compact store status widget for the dashboard.
 * Self-contained: fetches and polls on its own.
 */
export function WidgetStatusLoja() {
  const [data, setData] = useState<StoreStatusResponse | null>(null)
  const [, setTick] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchSeqRef = useRef(0)

  const fetchStatus = useCallback(async () => {
    const seq = ++fetchSeqRef.current
    try {
      const res = await fetch("/api/store/status", { cache: "no-store" })
      if (res.ok && seq === fetchSeqRef.current) setData(await res.json())
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 120_000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchStatus()
        pollRef.current = setInterval(fetchStatus, 120_000)
      } else {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [fetchStatus])

  // Refresh the "open for X" counter every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const isAberta = data?.status === "ABERTA" || data?.status === "ABERTA_COM_ALERTA"
  const op = data?.currentOperation
  const lastOp = data?.lastOperation

  return (
    <Link
      href="/agenda"
      className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/50 no-underline"
    >
      {/* Status indicator */}
      <div
        className={[
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isAberta
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        <Store className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div
            className={[
              "h-1.5 w-1.5 rounded-full",
              isAberta ? "bg-emerald-500" : "bg-zinc-400",
            ].join(" ")}
          />
          <span
            className={[
              "text-xs font-semibold tracking-wide",
              isAberta ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            ].join(" ")}
          >
            {data === null ? "Carregando..." : isAberta ? "LOJA ABERTA" : "LOJA FECHADA"}
          </span>
        </div>

        {isAberta && op ? (
          <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs truncate">
              Desde {formatTime(op.openedAt)} · {formatDuration(op.openedAt)}
            </span>
          </div>
        ) : !isAberta && lastOp?.closedAt ? (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            Fechada às {formatTime(lastOp.closedAt)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">Sem registro hoje</p>
        )}
      </div>
    </Link>
  )
}
