"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Store,
  Clock,
  User,
  History,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { StoreStatusResponse } from "@/types/store-operation"
import type { TimelineEvent } from "@/app/api/store/timeline/route"

const ALLOWED_ROLES = ["SUPER_USER", "ADMIN", "GESTOR", "GERENTE"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatDurationMinutes(minutes: number | null): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return `${h}h ${String(m).padStart(2, "0")}min`
}

function getElapsedHMS(openedAt: string): string {
  const diff = Math.max(0, Date.now() - new Date(openedAt).getTime())
  const totalSecs = Math.floor(diff / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atrás`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  return formatDate(iso)
}

// ─── LiveTimer (isolated — only this component re-renders every second) ───────

const LiveTimer = memo(function LiveTimer({ openedAt }: { openedAt: string }) {
  const [elapsed, setElapsed] = useState(() => getElapsedHMS(openedAt))

  useEffect(() => {
    setElapsed(getElapsedHMS(openedAt))
    const id = setInterval(() => setElapsed(getElapsedHMS(openedAt)), 1000)
    return () => clearInterval(id)
  }, [openedAt])

  return (
    <span className="font-mono tabular-nums text-base font-semibold text-foreground">
      {elapsed}
    </span>
  )
})

// ─── Timeline event config ────────────────────────────────────────────────────

type EventType = TimelineEvent["type"]

const EVENT_CONFIG: Record<
  EventType,
  { icon: React.ElementType; dotClass: string; iconClass: string }
> = {
  STORE_OPEN: {
    icon: Store,
    dotClass: "bg-emerald-500 border-emerald-500",
    iconClass: "text-emerald-500",
  },
  STORE_CLOSE: {
    icon: Store,
    dotClass: "bg-red-500 border-red-500",
    iconClass: "text-red-500",
  },
  TASK_CREATED: {
    icon: ClipboardList,
    dotClass: "bg-blue-500 border-blue-500",
    iconClass: "text-blue-500",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    dotClass: "bg-emerald-500 border-emerald-500",
    iconClass: "text-emerald-500",
  },
  TASK_LATE: {
    icon: Clock3,
    dotClass: "bg-amber-500 border-amber-500",
    iconClass: "text-amber-500",
  },
  TASK_RESTORED: {
    icon: RotateCcw,
    dotClass: "bg-muted-foreground border-muted-foreground",
    iconClass: "text-muted-foreground",
  },
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

interface TimelineItemProps {
  event: TimelineEvent
  isLast: boolean
  compact?: boolean
}

const TimelineItem = memo(function TimelineItem({ event, isLast, compact }: TimelineItemProps) {
  const cfg = EVENT_CONFIG[event.type]
  const Icon = cfg.icon

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className={`absolute left-[9px] top-5 bottom-0 w-px bg-border ${compact ? "" : ""}`} />
      )}

      <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-background">
        <div className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass.split(" ")[0]}`} />
      </div>

      <div className={`flex-1 ${isLast ? "" : compact ? "pb-3" : "pb-4"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className={`h-3 w-3 shrink-0 ${cfg.iconClass}`} />
            <p className={`${compact ? "text-xs" : "text-sm"} font-medium leading-tight`}>{event.title}</p>
          </div>
          <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0 mt-0.5">
            {compact ? formatTime(event.time) : formatRelativeTime(event.time)}
          </span>
        </div>
        {event.description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug truncate max-w-[240px]">
            {event.description}
          </p>
        )}
        {!compact && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/50 font-mono">
            {formatTime(event.time)}
          </p>
        )}
      </div>
    </div>
  )
})

// ─── Vertical Timeline ────────────────────────────────────────────────────────

const OperationalTimeline = memo(function OperationalTimeline({
  events,
}: {
  events: TimelineEvent[]
}) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60 py-3 text-center">
        Nenhuma atividade registrada ainda.
      </p>
    )
  }

  return (
    <div>
      {events.map((event, i) => (
        <TimelineItem key={event.id} event={event} isLast={i === events.length - 1} />
      ))}
    </div>
  )
})

// ─── History Sheet ─────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string
  openedAt: string
  closedAt: string | null
  durationMinutes: number | null
  openedBy: { name: string }
  closedBy: { name: string } | null
}

interface SessionCardProps {
  entry: HistoryEntry
  sessionEvents: TimelineEvent[]
}

function SessionCard({ entry, sessionEvents }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const preview = sessionEvents.slice(0, 5)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(entry.openedAt)}
          </div>
          {entry.closedAt ? (
            <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
              Fechada
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Aberta
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground mb-0.5">Abertura</p>
            <p className="font-medium">{formatTime(entry.openedAt)}</p>
            <p className="text-muted-foreground truncate">{entry.openedBy.name}</p>
          </div>
          {entry.closedAt && (
            <div>
              <p className="text-muted-foreground mb-0.5">Fechamento</p>
              <p className="font-medium">{formatTime(entry.closedAt)}</p>
              <p className="text-muted-foreground truncate">{entry.closedBy?.name ?? "—"}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            {formatDurationMinutes(entry.durationMinutes)}
            {sessionEvents.length > 0 && (
              <span className="ml-2 text-muted-foreground/60">· {sessionEvents.length} evento{sessionEvents.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          {sessionEvents.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Ocultar" : "Ver timeline"}
            </button>
          )}
        </div>
      </div>

      {expanded && preview.length > 0 && (
        <div className="px-4 py-3 border-t bg-muted/20">
          {preview.map((event, i) => (
            <TimelineItem key={event.id} event={event} isLast={i === preview.length - 1} compact />
          ))}
          {sessionEvents.length > 5 && (
            <p className="text-[11px] text-muted-foreground/60 mt-1 pl-8">
              +{sessionEvents.length - 5} evento{sessionEvents.length - 5 !== 1 ? "s" : ""} não exibido{sessionEvents.length - 5 !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function HistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch("/api/store/history?perPage=30", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : [])),
      fetch("/api/store/timeline?limit=100", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.events) ? d.events : [])),
    ])
      .then(([sessions, events]) => {
        setEntries(sessions)
        setAllEvents(events)
      })
      .catch(() => {
        setEntries([])
        setAllEvents([])
      })
      .finally(() => setLoading(false))
  }, [open])

  function getSessionEvents(entry: HistoryEntry): TimelineEvent[] {
    const from = new Date(entry.openedAt).getTime()
    const to = entry.closedAt ? new Date(entry.closedAt).getTime() : Date.now()
    return allEvents
      .filter((e) => {
        const t = new Date(e.time).getTime()
        return t >= from && t <= to
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }

  async function handleClearHistory() {
    setClearing(true)
    try {
      const res = await fetch("/api/store/clear-history", { method: "DELETE" })
      if (res.ok) {
        setEntries([])
        toast.success("Histórico operacional limpo.")
      } else {
        toast.error("Não foi possível limpar o histórico.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setClearing(false)
      setClearOpen(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico Operacional
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma operação registrada.
              </p>
            ) : (
              entries.map((entry) => (
                <SessionCard
                  key={entry.id}
                  entry={entry}
                  sessionEvents={getSessionEvents(entry)}
                />
              ))
            )}
          </div>

          {!loading && entries.length > 0 && (
            <div className="px-6 py-4 border-t shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClearOpen(true)}
                className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar histórico operacional
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico operacional?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação removerá permanentemente o histórico operacional salvo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleClearHistory}
              disabled={clearing}
            >
              {clearing ? "Limpando..." : "Limpar histórico"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StatusLoja() {
  const { data: session } = useSession()
  const role: string = (session?.user as any)?.role ?? ""
  const canOperate = ALLOWED_ROLES.includes(role)

  const [statusData, setStatusData] = useState<StoreStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionKind, setActionKind] = useState<"open" | "close" | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([])

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timelinePollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const actingRef = useRef(false)
  const fetchSeqRef = useRef(0)

  const fetchStatus = useCallback(async (silent = false) => {
    const seq = ++fetchSeqRef.current
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/store/status", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (seq === fetchSeqRef.current && !actingRef.current) {
          setStatusData(data)
        }
      }
    } catch {
      // ignore
    } finally {
      if (!silent && seq === fetchSeqRef.current) setLoading(false)
    }
  }, [])

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch("/api/store/timeline?limit=50", { cache: "no-store" }).catch(() => null)
      if (res?.ok) {
        const d = await res.json().catch(() => null)
        if (Array.isArray(d?.events)) setAllEvents(d.events)
      }
    } catch {
      // ignore
    }
  }, [])

  // Status: initial + poll 30s
  useEffect(() => {
    fetchStatus()

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchStatus(true)
        pollRef.current = setInterval(() => fetchStatus(true), 30_000)
      } else {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      }
    }

    pollRef.current = setInterval(() => fetchStatus(true), 30_000)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchStatus])

  // Timeline: initial + poll 15s
  useEffect(() => {
    fetchTimeline()
    timelinePollRef.current = setInterval(fetchTimeline, 15_000)
    return () => { if (timelinePollRef.current) clearInterval(timelinePollRef.current) }
  }, [fetchTimeline])

  const refetchAfterAction = useCallback(async () => {
    const seq = ++fetchSeqRef.current
    try {
      const res = await fetch("/api/store/status", { cache: "no-store" })
      if (res.ok && seq === fetchSeqRef.current) {
        setStatusData(await res.json())
      }
    } catch {
      // ignore
    }
  }, [])

  const handleOpen = useCallback(async () => {
    if (actingRef.current) return
    actingRef.current = true
    setActionKind("open")
    fetchSeqRef.current++
    // Clear current session events — new session begins
    setAllEvents([])
    setStatusData((prev) => (prev ? { ...prev, status: "ABERTA" } : null))
    try {
      const res = await fetch("/api/store/open", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao abrir loja")
        actingRef.current = false
        setActionKind(null)
        await refetchAfterAction()
        return
      }
      toast.success("Loja aberta com sucesso")
    } catch {
      toast.error("Erro de conexão")
      actingRef.current = false
      setActionKind(null)
      await refetchAfterAction()
      return
    }
    setActionKind(null)
    await refetchAfterAction()
    actingRef.current = false
    fetchTimeline()
  }, [refetchAfterAction, fetchTimeline])

  const handleClose = useCallback(async () => {
    if (actingRef.current) return
    actingRef.current = true
    setActionKind("close")
    fetchSeqRef.current++
    setStatusData((prev) => (prev ? { ...prev, status: "FECHADA" } : null))
    try {
      const res = await fetch("/api/store/close", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao fechar loja")
        actingRef.current = false
        setActionKind(null)
        await refetchAfterAction()
        return
      }
      toast.success("Loja fechada. Operação registrada.")
    } catch {
      toast.error("Erro de conexão")
      actingRef.current = false
      setActionKind(null)
      await refetchAfterAction()
      return
    }
    setActionKind(null)
    await refetchAfterAction()
    actingRef.current = false
    fetchTimeline()
  }, [refetchAfterAction, fetchTimeline])

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-px w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const isAberta =
    statusData?.status === "ABERTA" || statusData?.status === "ABERTA_COM_ALERTA"
  const hasAlert =
    statusData?.status === "ABERTA_COM_ALERTA" || statusData?.status === "FECHADA_COM_ALERTA"
  const op = statusData?.currentOperation
  const lastOp = statusData?.lastOperation

  // Filter to current session events only, sorted oldest-first
  const sessionOpenedAt = isAberta && op?.openedAt ? new Date(op.openedAt).getTime() : null
  const sessionEvents = sessionOpenedAt
    ? [...allEvents]
        .filter((e) => new Date(e.time).getTime() >= sessionOpenedAt)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    : []

  return (
    <>
      <div
        className={[
          "rounded-xl border bg-card overflow-hidden transition-colors duration-75",
          isAberta
            ? "border-emerald-500/40"
            : "border-muted",
        ].join(" ")}
      >
        {/* ── Status bar ── */}
        <div
          className={[
            "px-5 py-3 flex items-center justify-between",
            isAberta
              ? "bg-emerald-500/8 border-b border-emerald-500/15"
              : "bg-muted/30 border-b border-border",
          ].join(" ")}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={[
                "h-2.5 w-2.5 rounded-full",
                isAberta
                  ? "bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]"
                  : "bg-muted-foreground/40",
              ].join(" ")}
            />
            <span
              className={[
                "text-sm font-semibold tracking-wide",
                isAberta
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              {isAberta ? "LOJA ABERTA" : "LOJA FECHADA"}
            </span>
            {hasAlert && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-7 text-xs gap-1.5 text-muted-foreground"
          >
            <History className="h-3.5 w-3.5" />
            Histórico
          </Button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-4">

          {/* Open / closed info + timer */}
          {isAberta && op ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">
                  Aberta em {formatDateFull(op.openedAt)} às {formatTime(op.openedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">por {op.openedBy.name}</span>
                </div>
                <LiveTimer openedAt={op.openedAt} />
              </div>
            </div>
          ) : !isAberta && lastOp?.closedAt ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">
                  Fechada às {formatTime(lastOp.closedAt)} · {formatDurationMinutes(lastOp.durationMinutes)}
                </span>
              </div>
              {lastOp.closedBy && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-xs">por {lastOp.closedBy.name}</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Action button */}
          {canOperate && (
            <div>
              {isAberta ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmCloseOpen(true)}
                  disabled={actionKind !== null}
                  className="gap-2 border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500/50 dark:text-red-400"
                >
                  <Store className="h-3.5 w-3.5" />
                  {actionKind === "close" ? "Fechando..." : "Fechar Loja"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleOpen}
                  disabled={actionKind !== null}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Store className="h-3.5 w-3.5" />
                  {actionKind === "open" ? "Abrindo..." : "Abrir Loja"}
                </Button>
              )}
            </div>
          )}

          {isAberta && (
            <>
              <Separator />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-3">
                  Sessão atual
                </p>
                <OperationalTimeline events={sessionEvents} />
              </div>
            </>
          )}
        </div>
      </div>

      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar loja?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja fechar a loja? A operação atual será encerrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setConfirmCloseOpen(false)
                handleClose()
              }}
            >
              Confirmar fechamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
