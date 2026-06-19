"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { taskCreateSchema, taskUpdateSchema } from "@/lib/schemas"
import { api, ApiError } from "@/lib/api-client"
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
type RecorrenciaValue = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"

const RECORRENCIA_LABELS: Record<RecorrenciaValue, string> = {
  NONE: "Não recorrente",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
}

// Parse ISO string to a local Date (respecting Brazil timezone)
function isoParaDate(iso: string): Date {
  const parts = new Date(iso)
    .toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
}

// Convert local Date to ISO at 07:00 BRT (standard task start time)
function dateParaIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return new Date(`${y}-${m}-${day}T07:00:00`).toISOString()
}

function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
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
  const [prazo, setPrazo] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [responsavelId, setResponsavelId] = useState(currentUserId)
  const [recorrencia, setRecorrencia] = useState<RecorrenciaValue>("NONE")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  const podeEscolherResponsavel =
    currentUserRole === "ADMIN" || currentUserRole === "GESTOR" || currentUserRole === "SUPER_USER"

  useEffect(() => {
    if (open && tarefaParaEditar) {
      setTitulo(tarefaParaEditar.title)
      setDescricao(tarefaParaEditar.description ?? "")
      setPrioridade(prioridadeToSelectValue(tarefaParaEditar.priority))
      setPrazo(tarefaParaEditar.dueAt ? isoParaDate(tarefaParaEditar.dueAt) : null)
      setResponsavelId(tarefaParaEditar.assigneeId ?? usuarios[0]?.id ?? "")
      setRecorrencia((tarefaParaEditar.recurrenceType as RecorrenciaValue) ?? "NONE")
      setErro("")
      return
    }

    if (open) {
      setTitulo("")
      setDescricao("")
      setPrioridade("NENHUMA")
      setPrazo(null)
      setRecorrencia("NONE")
      setResponsavelId(podeEscolherResponsavel ? (usuarios[0]?.id ?? "") : "")
      setErro("")
    }
  }, [open, tarefaParaEditar, usuarios, podeEscolherResponsavel])

  async function salvar() {
    setSalvando(true)
    setErro("")

    try {
      const shouldIncludeAssignee = usuarios.length > 0 && podeEscolherResponsavel && responsavelId
      const dueAtIso = prazo ? dateParaIso(prazo) : undefined

      const payload = modoEdicao
        ? {
            title: titulo.trim(),
            description: descricao.trim() || null,
            priority: selectValueToPriority(prioridade),
            dueAt: dueAtIso,
            assigneeId: shouldIncludeAssignee ? responsavelId : undefined,
            recurrenceType: recorrencia !== "NONE" ? recorrencia : "NONE",
          }
        : {
            title: titulo.trim(),
            description: descricao.trim() || undefined,
            priority: selectValueToPriority(prioridade) ?? undefined,
            dueAt: dueAtIso,
            assigneeId: shouldIncludeAssignee ? responsavelId : undefined,
            recurrenceType: recorrencia !== "NONE" ? recorrencia : undefined,
          }

      const parsed = (modoEdicao ? taskUpdateSchema : taskCreateSchema).safeParse(payload)
      if (!parsed.success) {
        setErro(parsed.error.issues[0]?.message ?? "Dados inválidos.")
        return
      }

      if (modoEdicao && tarefaParaEditar) {
        try {
          const updatedTarefa = await api.updateTask(tarefaParaEditar.id, parsed.data)
          onAtualizada?.(updatedTarefa)
          toast.success("Tarefa atualizada com sucesso")
          onClose()
        } catch (error) {
          if (error instanceof ApiError) {
            console.error("[agenda/update] request failed", { status: error.status, code: error.code })
          } else {
            console.error("[agenda/update] unexpected error")
          }
          const message = "Não foi possível salvar a tarefa."
          setErro(message)
          toast.error(message)
        }
        return
      }

      const createPayload = {
        title: parsed.data.title as string,
        description: parsed.data.description ?? undefined,
        priority: parsed.data.priority ?? undefined,
        dueAt: parsed.data.dueAt ?? undefined,
        assigneeId: podeEscolherResponsavel && responsavelId ? responsavelId : null,
        recurrenceType: recorrencia !== "NONE" ? recorrencia : undefined,
      }

      try {
        const novaTarefa = await api.createTask(createPayload)
        onCriada(novaTarefa)
        toast.success("Tarefa criada com sucesso")
        onClose()
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("[agenda/create] request failed", { status: error.status, code: error.code })
        } else {
          console.error("[agenda/create] unexpected error")
        }
        const message = "Não foi possível criar a tarefa."
        setErro(message)
        toast.error(message)
      }
    } catch (error) {
      console.error("[agenda/save] unexpected error")
      const message = "Não foi possível salvar a tarefa."
      setErro(message)
      toast.error(message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base font-semibold">
            {modoEdicao ? "Editar Tarefa" : "Nova Tarefa"}
          </SheetTitle>
          <SheetDescription>
            {modoEdicao
              ? "Atualize os dados da tarefa e salve as alterações."
              : "Preencha os dados para criar uma nova tarefa na agenda."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            salvar()
          }}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5"
        >
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-sm font-medium">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ex: Ligar para cliente VIP"
              className="h-11 text-sm"
              autoFocus
            />
            {erro && <p className="text-xs text-destructive">{erro}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Adicione detalhes, contexto ou instruções para esta tarefa..."
              className="min-h-[120px] resize-y text-sm leading-relaxed"
            />
            {descricao.trim().length > 0 && descricao.trim().length < 5 && (
              <p className="text-xs text-destructive">Mínimo de 5 caracteres.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select
                value={prioridade}
                onValueChange={(value) => setPrioridade(value as PrioridadeSelectValue)}
              >
                <SelectTrigger className="w-full h-10">
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 justify-start gap-2 font-normal text-sm"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {prazo ? (
                      formatDateBR(prazo)
                    ) : (
                      <span className="text-muted-foreground">DD/MM/AAAA</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar
                    selected={prazo}
                    onSelect={(date) => {
                      setPrazo(date)
                      setCalendarOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Recorrência</Label>
            <Select value={recorrencia} onValueChange={(v) => setRecorrencia(v as RecorrenciaValue)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RECORRENCIA_LABELS) as RecorrenciaValue[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {RECORRENCIA_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {podeEscolherResponsavel && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-full h-10">
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

        <SheetFooter className="px-6 py-4 border-t gap-2 flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={salvando}
            className="flex-1 h-[50px]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex-1 h-[50px]"
          >
            {salvando ? "Salvando..." : modoEdicao ? "Salvar" : "Criar Tarefa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
