import { Archive, DollarSign, BarChart2, Layers, TrendingUp, Percent } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

const formatPct = (v: number) => `${v.toFixed(1)}%`

interface Summary {
  totalItens?: number
  totalProdutos?: number
  valorTotalEstoque?: number
  ticketMedio?: number
  margemMedia?: number
  lucroMedio?: number
  lastSyncAt?: string | null
  _meta?: { source?: string; durationMs?: number }
}

interface Props {
  summary: Summary | null
  showFinancial: boolean
  error?: boolean
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  description,
}: {
  icon: React.ElementType
  iconClassName: string
  label: string
  value: React.ReactNode
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}

export function ResumoOperacao({ summary, showFinancial, error }: Props) {
  // summary null = fetch falhou (auth/network); distinguir de "dados zerados após sync"
  const noData = summary === null
  const s = summary ?? {}
  const totalProdutos = s.totalProdutos ?? 0
  const totalItens = s.totalItens ?? 0

  // Quando o backend não responde, mostrar "—" ao invés de "0"
  // para não enganar o usuário
  const dash = "—"
  const fmtItens = noData ? dash : totalItens.toLocaleString("pt-BR")
  const fmtProdutos = noData ? dash : totalProdutos.toLocaleString("pt-BR")
  const fmtValor = noData ? dash : formatBRL(s.valorTotalEstoque ?? 0)
  const fmtTicket = noData ? dash : formatBRL(s.ticketMedio ?? 0)
  const fmtLucro = noData ? dash : formatBRL(s.lucroMedio ?? 0)
  const fmtMargem = noData ? dash : formatPct(s.margemMedia ?? 0)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        icon={Archive}
        iconClassName="text-muted-foreground"
        label="Total em Estoque"
        value={fmtItens}
        description={noData ? "Aguardando dados…" : `${totalProdutos} SKU${totalProdutos !== 1 ? "s" : ""} cadastrados`}
      />
      <StatCard
        icon={Layers}
        iconClassName="text-muted-foreground"
        label="Produtos Cadastrados"
        value={fmtProdutos}
        description={noData ? "Aguardando dados…" : "referências únicas"}
      />

      {showFinancial && (
        <>
          <StatCard
            icon={DollarSign}
            iconClassName="text-muted-foreground"
            label="Valor Total em Estoque"
            value={fmtValor}
          />
          <StatCard
            icon={BarChart2}
            iconClassName="text-muted-foreground"
            label="Ticket Médio"
            value={fmtTicket}
            description={noData ? undefined : "por produto cadastrado"}
          />
          <StatCard
            icon={TrendingUp}
            iconClassName="text-muted-foreground"
            label="Lucro Médio"
            value={fmtLucro}
            description={noData ? undefined : "por produto"}
          />
          <StatCard
            icon={Percent}
            iconClassName="text-muted-foreground"
            label="Margem Média"
            value={fmtMargem}
            description={noData ? undefined : "sobre preço de venda"}
          />
        </>
      )}
    </div>
  )
}
