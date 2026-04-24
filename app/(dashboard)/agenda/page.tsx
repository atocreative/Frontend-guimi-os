"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { sortTarefasByPriority } from "@/lib/tarefas"
import type { TarefaDB, UsuarioSimples, ResumoPainel } from "@/types/tarefas"

const ModalNovaTarefa = dynamic(
  () => import("@/components/agenda/modal-nova-tarefa").then((m) => m.ModalNovaTarefa),
  { ssr: false }
)

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

  const isColaborador = role === "COLABORADOR"

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
    setChecklistAbertura((prev) =>
      prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
    )
    setChecklistFechamento((prev) =>
      prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
    )

    const res = await fetch(`/api/checklist/${id}`, { method: "PATCH" })
    if (!res.ok) {
      setChecklistAbertura((prev) =>
        prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
      )
      setChecklistFechamento((prev) =>
        prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
      )
    }
  }, [])

  const handleToggle = useCallback(async (id: string) => {
    const tarefa = tarefas.find((t) => t.id === id)
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
    } else {
      const data = await res.json()
      setTarefas((prev) => prev.map((t) => (t.id === id ? data.tarefa : t)))
    }
  }, [tarefas])

  const handleDelete = useCallback(async (id: string) => {
    const tarefaAnterior = tarefas.find((t) => t.id === id)
    setTarefas((prev) => prev.filter((t) => t.id !== id))
    const res = await fetch(`/api/tarefas/${id}`, { method: "DELETE" })
    if (!res.ok && tarefaAnterior) {
      setTarefas((prev) => [...prev, tarefaAnterior])
    }
  }, [tarefas])

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
    for (const u of usuariosFiltrados) {
      map.set(u.id, tarefas.filter((t) => t.assigneeId === u.id))
    }
    return map
  }, [tarefas, usuariosFiltrados])

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

      <div>
        <h3 className="text-sm font-semibold mb-3">Checklists do Dia</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChecklistCard
            titulo="Abertura da Loja"
            itens={checklistAbertura}
            tipo="abertura"
            onToggle={toggleChecklist}
          />
          <ChecklistCard
            titulo="Fechamento da Loja"
            itens={checklistFechamento}
            tipo="fechamento"
            onToggle={toggleChecklist}
          />
        </div>
      </div>

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
      ) : usuarios.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        </div>
      ) : (
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
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
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
