import { CheckCircle, AlertCircle, ListTodo } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ResumoPainel } from "@/types/tarefas"

export function ResumoTime({ resumo }: { resumo: ResumoPainel }) {
  return (
    <div className="grid grid-cols-3 gap-3">
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
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
            <p className="text-xl font-bold text-emerald-500">{resumo.concluidas}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold text-amber-500">{resumo.pendentes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
