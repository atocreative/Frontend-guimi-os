import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GraficoVazioProps {
  titulo?: string
  descricao?: string
  /** Alias para descricao — usado em dashboard-admin */
  mensagem?: string
}

export function GraficoVazio({
  titulo = "Sem dados disponíveis",
  descricao,
  mensagem,
}: GraficoVazioProps) {
  const texto = descricao ?? mensagem ?? "Nenhuma venda registrada para este período"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {texto && <CardDescription>{texto}</CardDescription>}
      </CardHeader>
      <CardContent className="flex h-[240px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-8 w-8 opacity-50" />
          <p className="text-sm">Nenhum dado para exibir</p>
        </div>
      </CardContent>
    </Card>
  )
}
