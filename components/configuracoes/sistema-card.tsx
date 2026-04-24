import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { mockSistema } from "@/app/(dashboard)/configuracoes/data/mock"

type Sistema = typeof mockSistema

export function SistemaCard({ sistema }: { sistema: Sistema }) {
  const itens = [
    { label: "Versão", valor: sistema.versao },
    { label: "Empresa", valor: sistema.empresa },
    { label: "Fuso horário", valor: sistema.fusoHorario },
    { label: "Ambiente", valor: sistema.ambiente },
    { label: "Banco de dados", valor: sistema.banco },
    { label: "Deploy", valor: sistema.deploy },
    { label: "Última atualização", valor: new Date(sistema.ultimaAtualizacao).toLocaleDateString("pt-BR") },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Sistema</CardTitle>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Operacional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {itens.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-1.5 border-b last:border-0"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-medium">{item.valor}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
