"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { taskCreateSchema, taskUpdateSchema } from "@/lib/schemas"
import type { TarefaDB, UsuarioSimples } from "@/types/tarefas"

interface ModalNovaTarefaProps {
  open: boolean
  onClose: () => void
  usuarios: UsuarioSimples[]
  currentUserId: string
  currentUserRole: string
  tarefaParaEditar?: TarefaDB | null
  onCriada: (tarefa: TarefaDB) => void
  onAtualizada?: (tarefa: TarefaDB) => void
}

type PrioridadeSelectValue = "ALTA" | "MEDIA" | "BAIXA" | "NENHUMA"

function isoParaInputDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  })
}

function prioridadeToSelectValue(
  prioridade: TarefaDB["priority"]
): PrioridadeSelectValue {
  return prioridade ?? "NENHUMA"
}

function selectValueToPriority(valor: PrioridadeSelectValue): TarefaDB["priority"] {
  return valor === "NENHUMA" ? null : valor
}

export function ModalNovaTarefa({
  open,
  onClose,
  usuarios,
  currentUserId,
  currentUserRole,
  tarefaParaEditar,
  onCriada,
  onAtualizada,
}: ModalNovaTarefaProps) {
  const modoEdicao = !!tarefaParaEditar

  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [prioridade, setPrioridade] = useState<PrioridadeSelectValue>("NENHUMA")
  const [prazo, setPrazo] = useState("")
  const [horario, setHorario] = useState("")
  const [responsavelId, setResponsavelId] = useState(currentUserId)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  const podeEscolherResponsavel =
    currentUserRole === "ADMIN" || currentUserRole === "GESTOR"

  useEffect(() => {
    if (open && tarefaParaEditar) {
      setTitulo(tarefaParaEditar.title)
      setDescricao(tarefaParaEditar.description ?? "")
      setPrioridade(prioridadeToSelectValue(tarefaParaEditar.priority))
      setPrazo(
        tarefaParaEditar.dueAt ? isoParaInputDate(tarefaParaEditar.dueAt) : ""
      )
      setHorario(tarefaParaEditar.horario ?? "")
      setResponsavelId(tarefaParaEditar.assigneeId ?? currentUserId)
      setErro("")
      return
    }

    if (open) {
      setTitulo("")
      setDescricao("")
      setPrioridade("NENHUMA")
      setPrazo("")
      setHorario("")
      setResponsavelId(currentUserId)
      setErro("")
    }
  }, [open, tarefaParaEditar, currentUserId])

  async function salvar() {
    setSalvando(true)
    setErro("")

    try {
      const payload = {
        title: titulo.trim(),
        description: descricao.trim() || null,
        priority: selectValueToPriority(prioridade),
        dueAt: prazo || null,
        horario: horario || null,
        assigneeId: podeEscolherResponsavel ? responsavelId : undefined,
      }

      const parsed = (modoEdicao ? taskUpdateSchema : taskCreateSchema).safeParse(payload)
      if (!parsed.success) {
        setErro(parsed.error.issues[0]?.message ?? "Dados inválidos.")
        return
      }

      if (modoEdicao && tarefaParaEditar) {
        const res = await fetch(`/api/tarefas/${tarefaParaEditar.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErro(typeof data?.error === "string" ? data.error : "Erro ao salvar. Tente novamente.")
          return
        }

        const data = await res.json()
        onAtualizada?.(data.tarefa)
        onClose()
        return
      }

      const createPayload = {
        ...parsed.data,
        assigneeId: podeEscolherResponsavel ? responsavelId : currentUserId,
      }

      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErro(typeof data?.error === "string" ? data.error : "Erro ao criar tarefa. Tente novamente.")
        return
      }

      const data = await res.json()
      onCriada(data.tarefa)
      onClose()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{modoEdicao ? "Editar Tarefa" : "Nova Tarefa"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            salvar()
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ex: Ligar para cliente VIP"
              autoFocus
            />
            {erro && <p className="text-xs text-destructive">{erro}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Detalhes opcionais..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select
              value={prioridade}
              onValueChange={(value) => setPrioridade(value as PrioridadeSelectValue)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NENHUMA">Nenhuma</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo</Label>
            <Input
              id="prazo"
              type="date"
              value={prazo}
              onChange={(event) => setPrazo(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="horario">Horário</Label>
            <Input
              id="horario"
              type="time"
              value={horario}
              onChange={(event) => setHorario(event.target.value)}
            />
          </div>

          {podeEscolherResponsavel && (
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form>

        <SheetFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : modoEdicao ? "Salvar" : "Criar Tarefa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
