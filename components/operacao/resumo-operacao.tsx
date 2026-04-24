import { Package, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { mockResumoOperacao } from "@/app/(dashboard)/operacao/data/mock"

type Resumo = typeof mockResumoOperacao

export function ResumoOperacao({ resumo }: { resumo: Resumo }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Package className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
            <p className="text-xl font-bold text-emerald-500">
              {resumo.disponiveis}
            </p>
            <p className="text-xs text-muted-foreground">
              de {resumo.totalEstoque} no estoque
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reservados</p>
            <p className="text-xl font-bold text-amber-500">
              {resumo.reservados}
            </p>
            <p className="text-xs text-muted-foreground">aguardando venda</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aguard. Retirada</p>
            <p className="text-xl font-bold text-blue-500">
              {resumo.aguardandoRetirada}
            </p>
            <p className="text-xs text-muted-foreground">cliente a buscar</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trade-ins</p>
            <p className="text-xl font-bold text-purple-500">
              {resumo.tradeInsAbertos}
            </p>
            <p className="text-xs text-muted-foreground">em avaliação</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
