"use client"

import { memo, useState, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ResumoTime } from "@/components/agenda/resumo-time"
import { FiltroUsuario } from "@/components/agenda/filtro-usuario"
import { ColunaPessoa } from "@/components/agenda/coluna-pessoa"
import { TarefaCard } from "@/components/agenda/tarefa-card"
import { ChecklistCard } from "@/components/operacao/checklist-card"
import type { ItemChecklist } from "@/components/operacao/checklist-card"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { sortTarefasByPriority } from "@/lib/tarefas"
import type { TarefaDB, UsuarioSimples, ResumoPainel } from "@/types/tarefas"

const ModalNovaTarefa = dynamic(
  () => import("@/components/agenda/modal-nova-tarefa").then((m) => m.ModalNovaTarefa),
  { ssr: false }
)

interface ChecklistsGridProps {
  checklistAbertura: ItemChecklist[]
  checklistFechamento: ItemChecklist[]
  onToggle: (id: string) => Promise<void>
}

const ChecklistsGrid = memo(function ChecklistsGrid({
  checklistAbertura,
  checklistFechamento,
  onToggle,
}: ChecklistsGridProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Checklists do Dia</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChecklistCard
          titulo="Abertura da Loja"
          itens={checklistAbertura}
          tipo="abertura"
          onToggle={onToggle}
        />
        <ChecklistCard
          titulo="Fechamento da Loja"
          itens={checklistFechamento}
          tipo="fechamento"
          onToggle={onToggle}
        />
      </div>
    </div>
  )
})

interface TarefasGridProps {
  usuarios: UsuarioSimples[]
  usuariosFiltrados: UsuarioSimples[]
  tarefasPorUsuario: Map<string, TarefaDB[]>
  onToggle: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (tarefa: TarefaDB) => void
}

const TarefasGrid = memo(function TarefasGrid({
  usuarios,
  usuariosFiltrados,
  tarefasPorUsuario,
  onToggle,
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
          onToggle={onToggle}
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

  const [checklistAbertura, setChecklistAbertura] = useState<ItemChecklist[]>([])
  const [checklistFechamento, setChecklistFechamento] = useState<ItemChecklist[]>([])
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()

  const isColaborador = role === "COLABORADOR"

  const tarefasPorId = useMemo(
    () => new Map(tarefas.map((tarefa) => [tarefa.id, tarefa])),
    [tarefas]
  )
  const checklistPorId = useMemo(
    () => new Map([...checklistAbertura, ...checklistFechamento].map((item) => [item.id, item])),
    [checklistAbertura, checklistFechamento]
  )

  const carregarTarefas = useCallback(async () => {
    try {
      const [tarefasRes, checklistRes] = await Promise.all([
        fetch("/api/tarefas"),
        fetch("/api/checklist"),
      ])
      if (tarefasRes.ok) {
        const data = await tarefasRes.json()
        setTarefas(data.tarefas)
        setUsuarios(data.usuarios)
      }
      if (checklistRes.ok) {
        const data = await checklistRes.json()
        setChecklistAbertura(data.abertura)
        setChecklistFechamento(data.fechamento)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarTarefas()
  }, [carregarTarefas])

  const toggleChecklist = useCallback(async (id: string) => {
    const itemAtual = checklistPorId.get(id)
    const completed = itemAtual ? !itemAtual.concluido : true

    setChecklistAbertura((prev) =>
      prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
    )
    setChecklistFechamento((prev) =>
      prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
    )

    const res = await fetch(`/api/checklist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
    if (!res.ok) {
      setChecklistAbertura((prev) =>
        prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
      )
      setChecklistFechamento((prev) =>
        prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
      )
    }
  }, [checklistPorId])

  const handleToggle = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    if (!tarefa) return

    const novoStatus = tarefa.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA"

    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t))
    )

    const res = await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    })

    if (!res.ok) {
      setTarefas((prev) => prev.map((t) => (t.id === id ? tarefa : t)))
      notifyTaskCompletionError()
    } else {
      const data = await res.json()
      setTarefas((prev) => prev.map((t) => (t.id === id ? data.tarefa : t)))

      if (novoStatus === "CONCLUIDA") {
        notifyTaskCompleted({ taskTitle: tarefa.title })
      }
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId])

  const handleDelete = useCallback(async (id: string) => {
    const tarefaAnterior = tarefasPorId.get(id)
    setTarefas((prev) => prev.filter((t) => t.id !== id))
    const res = await fetch(`/api/tarefas/${id}`, { method: "DELETE" })
    if (!res.ok && tarefaAnterior) {
      setTarefas((prev) => [...prev, tarefaAnterior])
    }
  }, [tarefasPorId])

  const handleEdit = useCallback((tarefa: TarefaDB) => {
    setTarefaEditando(tarefa)
    setModalAberto(true)
  }, [])

  const handleCriada = useCallback((novaTarefa: TarefaDB) => {
    setTarefas((prev) => [novaTarefa, ...prev])
  }, [])

  const handleAtualizada = useCallback((tarefa: TarefaDB) => {
    setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? tarefa : t)))
    setTarefaEditando(null)
    setModalAberto(false)
  }, [])

  const handleFecharModal = useCallback(() => {
    setModalAberto(false)
    setTarefaEditando(null)
  }, [])

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true)
  }, [])

  const usuariosFiltrados = useMemo(
    () => (filtroId ? usuarios.filter((u) => u.id === filtroId) : usuarios),
    [usuarios, filtroId]
  )

  const tarefasOrdenadas = useMemo(
    () => sortTarefasByPriority(tarefas),
    [tarefas]
  )

  const resumo: ResumoPainel = useMemo(
    () => ({
      total: tarefas.length,
      concluidas: tarefas.filter((t) => t.status === "CONCLUIDA").length,
      pendentes: tarefas.filter((t) => t.status !== "CONCLUIDA").length,
    }),
    [tarefas]
  )

  const tarefasPorUsuario = useMemo(() => {
    const map = new Map<string, TarefaDB[]>()
    const usuariosIds = new Set(usuariosFiltrados.map((usuario) => usuario.id))

    for (const usuario of usuariosFiltrados) {
      map.set(usuario.id, [])
    }

    for (const tarefa of tarefasOrdenadas) {
      if (!tarefa.assigneeId || !usuariosIds.has(tarefa.assigneeId)) continue
      map.get(tarefa.assigneeId)?.push(tarefa)
    }

    return map
  }, [tarefasOrdenadas, usuariosFiltrados])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agenda e Tarefas</h2>
          <p className="text-sm text-muted-foreground">
            Quadro de tarefas da operação
          </p>
        </div>
        <Button size="sm" onClick={handleAbrirModal} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

      <ChecklistsGrid
        checklistAbertura={checklistAbertura}
        checklistFechamento={checklistFechamento}
        onToggle={toggleChecklist}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : isColaborador ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            {tarefas.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa atribuída a você.
                </p>
              </div>
            ) : (
              tarefasOrdenadas.map((tarefa) => (
                <TarefaCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  onToggle={() => handleToggle(tarefa.id)}
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
          onToggle={handleToggle}
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
