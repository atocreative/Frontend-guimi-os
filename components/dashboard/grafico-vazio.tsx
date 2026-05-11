import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GraficoVazioProps {
  titulo?: string
  descricao?: string
}

export function GraficoVazio({
  titulo = "Sem dados disponíveis",
  descricao = "Nenhuma venda registrada para este período"
}: GraficoVazioProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
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
