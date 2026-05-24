"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Calendar,
  User,
  Trophy,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import type { TarefaDB, UsuarioSimples } from "@/types/tarefas"

const PRIORITY_LABEL: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
}

const PRIORITY_BADGE: Record<string, string> = {
  ALTA: "bg-red-500/10 text-red-600 border-red-500/20",
  MEDIA: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  BAIXA: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function wasLate(tarefa: TarefaDB): boolean {
  if (!tarefa.dueAt || !tarefa.completedAt) return false
  const prazo = new Date(tarefa.dueAt)
  prazo.setHours(23, 59, 59, 999)
  return new Date(tarefa.completedAt) > prazo
}

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border text-xs font-semibold text-muted-foreground select-none">
      {initial}
    </div>
  )
}

interface TarefaRowProps {
  tarefa: TarefaDB
  onVerDetalhes: (t: TarefaDB) => void
}

function TarefaRow({ tarefa, onVerDetalhes }: TarefaRowProps) {
  const late = wasLate(tarefa) || tarefa.status === "CONCLUIDA_ATRASADA"

  return (
    <div
      onClick={() => onVerDetalhes(tarefa)}
      className={cn(
        "flex items-start gap-4 rounded-lg border bg-card px-4 py-4 cursor-pointer hover:bg-muted/40 transition-colors duration-75",
        late
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      {/* Avatar */}
      {tarefa.assignee?.name ? (
        <UserAvatar name={tarefa.assignee.name} />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Assignee name */}
        {tarefa.assignee?.name && (
          <p className="text-xs font-medium text-foreground">{tarefa.assignee.name}</p>
        )}

        {/* Title */}
        <p className="text-sm font-medium leading-snug truncate">
          {tarefa.title}
        </p>

        {/* Description preview */}
        {tarefa.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1">{tarefa.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap pt-0.5">
          {late ? (
            <Badge variant="outline" className="px-1.5 py-0 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Atrasada
            </Badge>
          ) : (
            <Badge variant="outline" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              No prazo
            </Badge>
          )}
          {tarefa.priority && (
            <Badge variant="outline" className={cn("px-1.5 py-0 text-xs", PRIORITY_BADGE[tarefa.priority])}>
              {PRIORITY_LABEL[tarefa.priority]}
            </Badge>
          )}
          {tarefa.pointsAwarded != null && tarefa.pointsAwarded > 0 && (
            <Badge variant="outline" className="px-1.5 py-0 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Trophy className="h-3 w-3 mr-1" />
              +{tarefa.pointsAwarded} pts
            </Badge>
          )}
          {tarefa.completedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(tarefa.completedAt, true)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HistoricoPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const isColaborador = role === "COLABORADOR"

  const [tarefas, setTarefas] = useState<TarefaDB[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioSimples[]>([])
  const [loading, setLoading] = useState(true)
  const [detalhe, setDetalhe] = useState<TarefaDB | null>(null)
  const [restoring, setRestoring] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [busca, setBusca] = useState("")
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("TODAS")
  const [filtroUsuario, setFiltroUsuario] = useState<string>("TODOS")
  const [filtroAtrasadas, setFiltroAtrasadas] = useState<string>("TODAS")

  const carregar = useCallback(async () => {
    try {
      const params = { includeOld: true, limit: 100, orderBy: "completedAt", sort: "desc" } as const
      const [concluidaData, atrasadaData, usuariosData] = await Promise.all([
        api.getTasks({ ...params, status: "CONCLUIDA" }).catch(() => ({ tasks: [], total: 0 })),
        api.getTasks({ ...params, status: "CONCLUIDA_ATRASADA" }).catch(() => ({ tasks: [], total: 0 })),
        api.getUsers().catch(() => ({ users: [], total: 0 })),
      ])
      const merged = [...(concluidaData.tasks || []), ...(atrasadaData.tasks || [])]
      merged.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
        return bTime - aTime
      })
      setTarefas(merged)
      setUsuarios(usuariosData.users || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleRestore(id: string) {
    setRestoring(true)
    try {
      await api.restoreTask(id)
      setTarefas((prev) => prev.filter((t) => t.id !== id))
      setDetalhe(null)
      toast.success("Tarefa retornada para a agenda")
    } catch {
      toast.error("Não foi possível retornar a tarefa.")
    } finally {
      setRestoring(false)
    }
  }

  // Silent 30s polling — auto-shows newly completed tasks without reload
  useEffect(() => {
    const silentRefetch = async () => {
      if (document.visibilityState !== "visible") return
      try {
        const params = { includeOld: true, limit: 100, orderBy: "completedAt", sort: "desc" } as const
        const [concluidaData, atrasadaData] = await Promise.all([
          api.getTasks({ ...params, status: "CONCLUIDA" }).catch(() => ({ tasks: [], total: 0 })),
          api.getTasks({ ...params, status: "CONCLUIDA_ATRASADA" }).catch(() => ({ tasks: [], total: 0 })),
        ])
        const merged = [...(concluidaData.tasks || []), ...(atrasadaData.tasks || [])]
        merged.sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
          return bTime - aTime
        })
        setTarefas(merged)
      } catch { /* silent */ }
    }
    timerRef.current = setInterval(silentRefetch, 60_000)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") silentRefetch()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  const tarefasFiltradas = useMemo(() => {
    const buscaLower = busca.trim().toLowerCase()
    return tarefas.filter((t) => {
      if (buscaLower) {
        const match =
          t.title.toLowerCase().includes(buscaLower) ||
          (t.description ?? "").toLowerCase().includes(buscaLower) ||
          (t.assignee?.name ?? "").toLowerCase().includes(buscaLower)
        if (!match) return false
      }
      if (filtroPrioridade !== "TODAS" && t.priority !== filtroPrioridade) return false
      if (!isColaborador && filtroUsuario !== "TODOS" && t.assigneeId !== filtroUsuario) return false
      const isLate = wasLate(t) || t.status === "CONCLUIDA_ATRASADA"
      if (filtroAtrasadas === "ATRASADAS" && !isLate) return false
      if (filtroAtrasadas === "NO_PRAZO" && isLate) return false
      return true
    })
  }, [tarefas, busca, filtroPrioridade, filtroUsuario, filtroAtrasadas, isColaborador])

  const totalAtrasadas = useMemo(
    () => tarefas.filter((t) => wasLate(t) || t.status === "CONCLUIDA_ATRASADA").length,
    [tarefas]
  )

  const detalheIsLate = detalhe
    ? wasLate(detalhe) || detalhe.status === "CONCLUIDA_ATRASADA"
    : false

  const detalheMetaItems = detalhe
    ? [
        detalhe.createdBy ? { label: "Criada por", value: detalhe.createdBy } : null,
        detalhe.completedByName ? { label: "Concluída por", value: detalhe.completedByName } : null,
        detalhe.pointsAwarded != null && detalhe.pointsAwarded > 0
          ? { label: "Pontos históricos", value: `+${detalhe.pointsAwarded} pts` }
          : null,
        detalhe.status === "CONCLUIDA_ATRASADA"
          ? { label: "Eficiência", value: "50% · atrasada" }
          : { label: "Eficiência", value: "100% · no prazo" },
      ].filter(Boolean) as Array<{ label: string; value: string }>
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/agenda">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Histórico de Tarefas</h2>
            <p className="text-sm text-muted-foreground">Todas as tarefas concluídas</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total concluídas</p>
              <p className="text-2xl font-bold text-emerald-600">{tarefas.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Concluídas atrasadas</p>
              <p className="text-2xl font-bold text-red-500">{totalAtrasadas}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">No prazo</p>
              <p className="text-2xl font-bold">{tarefas.length - totalAtrasadas}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, descrição ou responsável..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger className="h-8 w-auto text-xs gap-1.5">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as prioridades</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {!isColaborador && usuarios.length > 0 && (
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="h-8 w-auto text-xs gap-1.5">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os responsáveis</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filtroAtrasadas} onValueChange={setFiltroAtrasadas}>
              <SelectTrigger className="h-8 w-auto text-xs gap-1.5">
                <SelectValue placeholder="Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="NO_PRAZO">No prazo</SelectItem>
                <SelectItem value="ATRASADAS">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))
        ) : tarefasFiltradas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {tarefas.length === 0
                ? "Nenhuma tarefa concluída ainda."
                : "Nenhuma tarefa encontrada com os filtros aplicados."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? "s" : ""} encontrada{tarefasFiltradas.length !== 1 ? "s" : ""}
            </p>
            {tarefasFiltradas.map((tarefa) => (
              <TarefaRow
                key={tarefa.id}
                tarefa={tarefa}
                onVerDetalhes={setDetalhe}
              />
            ))}
          </>
        )}
      </div>

      {/* Sheet detalhes */}
      <Sheet open={!!detalhe} onOpenChange={(v) => { if (!v && !restoring) setDetalhe(null) }}>
        <SheetContent side="right" aria-describedby="historico-sheet-desc" className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden">
          {detalhe && (
            <>
              {/* Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Concluída
                  </Badge>
                  {detalheIsLate ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Atrasada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      No prazo
                    </Badge>
                  )}
                  {detalhe.priority && (
                    <Badge variant="outline" className={cn(PRIORITY_BADGE[detalhe.priority])}>
                      {PRIORITY_LABEL[detalhe.priority]}
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-base font-semibold leading-snug pr-8">
                  {detalhe.title}
                </SheetTitle>
                <SheetDescription id="historico-sheet-desc" className="sr-only">
                  Detalhes da tarefa concluída
                </SheetDescription>
              </SheetHeader>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Descrição */}
                {detalhe.description && (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Descrição
                      </p>
                      <div className="rounded-lg bg-muted/50 border px-4 py-3">
                        <p className="text-sm leading-relaxed">{detalhe.description}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Responsável */}
                {detalhe.assignee && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Responsável
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{detalhe.assignee.name}</p>
                          {detalhe.assignee.jobTitle && (
                            <p className="text-xs text-muted-foreground">{detalhe.assignee.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Datas */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Datas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {detalhe.dueAt && (
                      <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Prazo</p>
                        <p className={cn("text-sm font-medium", detalheIsLate && "text-red-500")}>
                          {formatDate(detalhe.dueAt)}
                        </p>
                      </div>
                    )}
                    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Criada em</p>
                      <p className="text-sm font-medium">{formatDate(detalhe.createdAt)}</p>
                    </div>
                    {detalhe.completedAt && (
                      <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Concluída em</p>
                        <p className="text-sm font-medium text-emerald-600">
                          {formatDate(detalhe.completedAt, true)}
                        </p>
                      </div>
                    )}
                    {detalhe.completedByName && (
                      <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Concluída por</p>
                        <p className="text-sm font-medium">{detalhe.completedByName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadados históricos */}
                {detalheMetaItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Metadados históricos
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {detalheMetaItems.map((item) => (
                          <div key={item.label} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                            <p className="text-sm font-medium">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Gamificação */}
                {detalhe.pointsAwarded != null && detalhe.pointsAwarded > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Gamificação
                      </p>
                      <div className="flex items-center gap-3 rounded-lg border bg-amber-500/5 border-amber-500/20 px-4 py-3">
                        <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-600">
                            +{detalhe.pointsAwarded} pontos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {detalheIsLate ? "Conclusão atrasada — 50% de eficiência" : "Conclusão no prazo — 100% de eficiência"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Justificativa do atraso */}
                {detalhe.lateReason && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Justificativa do atraso
                      </p>
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                        <p className="text-sm leading-relaxed">{detalhe.lateReason}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!isColaborador && (
                <SheetFooter className="px-6 py-4 border-t shrink-0">
                  <Button
                    variant="outline"
                    className="w-full h-[50px] gap-2"
                    disabled={restoring}
                    onClick={() => handleRestore(detalhe.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {restoring ? "Retornando..." : "Retornar para agenda"}
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
