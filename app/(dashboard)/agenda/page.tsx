"use client"

import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { Plus, History } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ResumoTime } from "@/components/agenda/resumo-time"
import { FiltroUsuario } from "@/components/agenda/filtro-usuario"
import { ColunaPessoa } from "@/components/agenda/coluna-pessoa"
import { TarefaCard } from "@/components/agenda/tarefa-card"
import { StatusLoja } from "@/components/operacao/status-loja"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { isTaskAtrasada, normalizeTaskMetrics, sortTarefasByPriority } from "@/lib/tarefas"
import { api } from "@/lib/api-client"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import type { TarefaDB, UsuarioSimples, ResumoPainel } from "@/types/tarefas"

const ModalNovaTarefa = dynamic(
  () => import("@/components/agenda/modal-nova-tarefa").then((m) => m.ModalNovaTarefa),
  { ssr: false }
)

interface TarefasGridProps {
  usuarios: UsuarioSimples[]
  usuariosFiltrados: UsuarioSimples[]
  tarefasPorUsuario: Map<string, TarefaDB[]>
  onComplete: (id: string, lateReason?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (tarefa: TarefaDB) => void
}

const TarefasGrid = memo(function TarefasGrid({
  usuarios,
  usuariosFiltrados,
  tarefasPorUsuario,
  onComplete,
  onDelete,
  onEdit,
}: TarefasGridProps) {
  if (usuarios.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
      </div>
    )
  }

  return (
    <div
      className={
        usuariosFiltrados.length === 1
          ? "max-w-lg"
          : "grid grid-cols-1 gap-4 md:grid-cols-3"
      }
    >
      {usuariosFiltrados.map((usuario) => (
        <ColunaPessoa
          key={usuario.id}
          nome={usuario.name}
          avatarUrl={usuario.avatarUrl}
          tarefas={tarefasPorUsuario.get(usuario.id) ?? []}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
})

export default function AgendaPage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const [tarefas, setTarefas] = useState<TarefaDB[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioSimples[]>([])
  const [filtroId, setFiltroId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [tarefaEditando, setTarefaEditando] = useState<TarefaDB | null>(null)

  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
  const completingRef = useRef(new Set<string>())

  const isColaborador = role === "COLABORADOR"
  const canSeeHistorico = !isColaborador

  const tarefasPorId = useMemo(
    () => new Map(tarefas.map((tarefa) => [tarefa.id, tarefa])),
    [tarefas]
  )
  const carregarTarefas = useCallback(async () => {
    try {
      const [tarefasData, usuariosData] = await Promise.all([
        api.getTasks().catch(() => ({ tasks: [], total: 0 })),
        api.getUsers().catch(() => ({ users: [], total: 0 })),
      ])
      setTarefas(tarefasData.tasks || [])
      setUsuarios(usuariosData.users || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const { triggerSync } = useRealtimeSync(carregarTarefas, {
    interval: 30_000,
    immediate: false, // already called on mount via useEffect below
  })

  useEffect(() => {
    carregarTarefas()
  }, [carregarTarefas])

  const handleComplete = useCallback(async (id: string, lateReason?: string) => {
    if (completingRef.current.has(id)) return
    const tarefa = tarefasPorId.get(id)
    if (!tarefa) return

    completingRef.current.add(id)

    // Optimistic update
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "CONCLUIDA" } : t))
    )

    try {
      const updatedTarefa = await api.completeTask(id, lateReason ? { lateReason } : undefined)
      setTarefas((prev) => prev.map((t) => (t.id === id ? updatedTarefa : t)))
      notifyTaskCompleted({ taskTitle: tarefa.title, pointsAwarded: updatedTarefa.pointsAwarded, isLate: updatedTarefa.status === "CONCLUIDA_ATRASADA" })
      triggerSync()
    } catch (error) {
      const apiError = error as { status?: number }
      if (apiError?.status === 409) {
        toast.info("Essa tarefa já foi concluída.")
        triggerSync()
        return
      }
      console.error("Erro ao concluir tarefa:", error)
      setTarefas((prev) => prev.map((t) => (t.id === id ? tarefa : t)))
      notifyTaskCompletionError()
      toast.error("Falha ao concluir tarefa. Tente novamente.")
    } finally {
      completingRef.current.delete(id)
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId, triggerSync])

  const handleDelete = useCallback(async (id: string) => {
    const tarefaAnterior = tarefasPorId.get(id)
    setTarefas((prev) => prev.filter((t) => t.id !== id))
    try {
      await api.deleteTask(id)
      toast.success("Tarefa deletada com sucesso")
    } catch (error) {
      const apiError = error as { status?: number }
      if (apiError?.status === 403) {
        toast.info("Tarefas concluídas fazem parte da auditoria e não podem ser removidas.")
        if (tarefaAnterior) setTarefas((prev) => [...prev, tarefaAnterior])
        return
      }
      console.error("Erro ao deletar tarefa:", error)
      if (tarefaAnterior) {
        setTarefas((prev) => [...prev, tarefaAnterior])
      }
      toast.error("Falha ao deletar tarefa. Tente novamente.")
    }
  }, [tarefasPorId])

  const handleEdit = useCallback((tarefa: TarefaDB) => {
    setTarefaEditando(tarefa)
    setModalAberto(true)
  }, [])

  const handleCriada = useCallback((novaTarefa: TarefaDB) => {
    setTarefas((prev) => [novaTarefa, ...prev])
    triggerSync()
  }, [triggerSync])

  const handleAtualizada = useCallback((tarefa: TarefaDB) => {
    setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? tarefa : t)))
    setTarefaEditando(null)
    setModalAberto(false)
  }, [])

  const handleFecharModal = useCallback(() => {
    setModalAberto(false)
    setTarefaEditando(null)
  }, [])

  const usuariosFiltrados = useMemo(
    () => (filtroId ? usuarios.filter((u) => u.id === filtroId) : usuarios),
    [usuarios, filtroId]
  )

  const tarefasOrdenadas = useMemo(
    () => sortTarefasByPriority(tarefas),
    [tarefas]
  )

  // Tarefas concluídas somem da agenda após 12h (mas ficam no histórico)
  const tarefasVisiveis = useMemo(() => {
    const TWELVE_H = 12 * 60 * 60 * 1000
    return tarefasOrdenadas.filter((t) => {
      if (t.status !== "CONCLUIDA" && t.status !== "CONCLUIDA_ATRASADA") return true
      if (!t.completedAt) return true
      return Date.now() - new Date(t.completedAt).getTime() < TWELVE_H
    })
  }, [tarefasOrdenadas])

  const resumo: ResumoPainel = useMemo(() => {
    const metrics = normalizeTaskMetrics(tarefas)
    return {
      total: metrics.total,
      concluidas: metrics.completedTasks,
      pendentes: metrics.pendingTasks,
      atrasadas: tarefas.filter((t) => isTaskAtrasada(t)).length,
    }
  }, [tarefas])

  const tarefasPorUsuario = useMemo(() => {
    const map = new Map<string, TarefaDB[]>()
    const usuariosIds = new Set(usuariosFiltrados.map((u) => u.id))

    for (const usuario of usuariosFiltrados) {
      map.set(usuario.id, [])
    }

    for (const tarefa of tarefasVisiveis) {
      if (!tarefa.assigneeId || !usuariosIds.has(tarefa.assigneeId)) continue
      map.get(tarefa.assigneeId)?.push(tarefa)
    }

    return map
  }, [tarefasVisiveis, usuariosFiltrados])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agenda e Tarefas</h2>
          <p className="text-sm text-muted-foreground">
            Quadro de tarefas da operação
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSeeHistorico && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/agenda/historico">
                <History className="h-4 w-4" />
                Histórico
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={() => setModalAberto(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : (
        <ResumoTime resumo={resumo} />
      )}

      {!loading && !isColaborador && usuarios.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Filtrar por pessoa
          </p>
          <FiltroUsuario
            usuarios={usuarios}
            selecionado={filtroId}
            onSelecionar={setFiltroId}
          />
        </div>
      )}

      <StatusLoja />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : isColaborador ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            {tarefasVisiveis.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa atribuída a você.
                </p>
              </div>
            ) : (
              tarefasVisiveis.map((tarefa) => (
                <TarefaCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  onComplete={handleComplete}
                  onDelete={() => handleDelete(tarefa.id)}
                  onEdit={() => handleEdit(tarefa)}
                />
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <TarefasGrid
          usuarios={usuarios}
          usuariosFiltrados={usuariosFiltrados}
          tarefasPorUsuario={tarefasPorUsuario}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {session?.user && (
        <ModalNovaTarefa
          open={modalAberto}
          onClose={handleFecharModal}
          usuarios={usuarios}
          currentUserId={session.user.id}
          currentUserRole={role ?? "COLABORADOR"}
          tarefaParaEditar={tarefaEditando}
          onCriada={handleCriada}
          onAtualizada={handleAtualizada}
        />
      )}
    </div>
  )
}
