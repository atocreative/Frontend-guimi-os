import { Archive, DollarSign, Layers, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

interface Summary {
  totalItens?: number
  totalProdutos?: number
  valorTotalEstoque?: number
  lastSyncAt?: string | null
  _meta?: { source?: string; durationMs?: number }
}

interface Props {
  summary: Summary | null
  showFinancial: boolean
  totalVendidos?: number
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

export function ResumoOperacao({ summary, showFinancial, totalVendidos }: Props) {
  const noData = summary === null
  const s = summary ?? {}
  const totalProdutos = s.totalProdutos ?? 0
  const totalItens = s.totalItens ?? 0

  const dash = "—"
  const fmtItens = noData ? dash : totalItens.toLocaleString("pt-BR")
  const fmtProdutos = noData ? dash : totalProdutos.toLocaleString("pt-BR")
  const fmtValor = noData ? dash : formatBRL(s.valorTotalEstoque ?? 0)
  const fmtVendidos = totalVendidos == null ? dash : totalVendidos.toLocaleString("pt-BR")

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Archive}
        iconClassName="text-muted-foreground"
        label="Total em Estoque"
        value={fmtItens}
        description={noData ? "Aguardando dados…" : "unidades"}
      />
      <StatCard
        icon={Layers}
        iconClassName="text-muted-foreground"
        label="Produtos Cadastrados"
        value={fmtProdutos}
        description={noData ? "Aguardando dados…" : "referências únicas"}
      />
      {showFinancial && (
        <StatCard
          icon={DollarSign}
          iconClassName="text-muted-foreground"
          label="Valor Total em Estoque"
          value={fmtValor}
        />
      )}
      <StatCard
        icon={ShoppingCart}
        iconClassName="text-muted-foreground"
        label="Produtos Vendidos"
        value={fmtVendidos}
        description={totalVendidos == null ? "Aguardando dados…" : "unidades vendidas"}
      />
    </div>
  )
}
