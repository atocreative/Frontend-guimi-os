import { CheckCircle, AlertCircle, AlertTriangle, ListTodo } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TASK_SUMMARY_COLORS } from "@/lib/colors-config"
import type { ResumoPainel } from "@/types/tarefas"

export function ResumoTime({ resumo }: { resumo: ResumoPainel }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{resumo.total}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`rounded-lg p-2 ${TASK_SUMMARY_COLORS.completed.bg}`}>
            <CheckCircle className={`h-4 w-4 ${TASK_SUMMARY_COLORS.completed.icon}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
            <p className={`text-xl font-bold ${TASK_SUMMARY_COLORS.completed.icon}`}>
              {resumo.concluidas}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`rounded-lg p-2 ${TASK_SUMMARY_COLORS.pending.bg}`}>
            <AlertCircle className={`h-4 w-4 ${TASK_SUMMARY_COLORS.pending.icon}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className={`text-xl font-bold ${TASK_SUMMARY_COLORS.pending.icon}`}>
              {resumo.pendentes}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`rounded-lg p-2 ${TASK_SUMMARY_COLORS.overdue.bg}`}>
            <AlertTriangle className={`h-4 w-4 ${TASK_SUMMARY_COLORS.overdue.icon}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
            <p className={`text-xl font-bold ${TASK_SUMMARY_COLORS.overdue.icon}`}>
              {resumo.atrasadas}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
