import { ResumoOperacao } from "@/components/operacao/resumo-operacao"
import { AparelhoCard } from "@/components/operacao/aparelho-card"
import {
  mockEstoque,
  mockTradeIns,
  mockResumoOperacao,
} from "./data/mock"

export default function OperacaoPage() {
  const aguardandoRetirada = mockEstoque.filter(
    (a) => a.status === "AGUARDANDO_RETIRADA"
  )
  const disponiveis = mockEstoque.filter(
    (a) => a.status === "DISPONIVEL" || a.status === "RESERVADO"
  )

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h2 className="text-xl font-semibold">Operação</h2>
        <p className="text-sm text-muted-foreground">
          Controle de estoque
        </p>
      </div>

      {/* Resumo */}
      <ResumoOperacao resumo={mockResumoOperacao} />



      {/* Aguardando Retirada — destaque */}
      {aguardandoRetirada.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Aguardando Retirada
            <span className="ml-2 text-xs font-normal text-blue-500">
              cliente precisa buscar hoje
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {aguardandoRetirada.map((a) => (
              <AparelhoCard key={a.id} aparelho={a} />
            ))}
          </div>
        </div>
      )}

      {/* Estoque */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Estoque
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            novos e seminovos disponíveis e reservados
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {disponiveis.map((a) => (
            <AparelhoCard key={a.id} aparelho={a} />
          ))}
        </div>
      </div>

      {/* Trade-ins */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Trade-ins Recebidos
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            aparelhos recebidos aguardando ou com avaliação concluída
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {mockTradeIns.map((a) => (
            <AparelhoCard key={a.id} aparelho={a} />
          ))}
        </div>
      </div>

    </div>
  )
}
