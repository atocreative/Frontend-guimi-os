import { AlertTriangle, Info, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Alerta {
  id: string
  tipo: "urgente" | "atencao" | "info"
  mensagem: string
}

export function PainelAlertas({ alertas }: { alertas: Alerta[] }) {
  const icones = {
    urgente: <Zap className="h-3.5 w-3.5 text-red-500" />,
    atencao: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    info: <Info className="h-3.5 w-3.5 text-blue-500" />,
  }

  const cores = {
    urgente: "border-red-500/20 bg-red-500/5",
    atencao: "border-amber-500/20 bg-amber-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2",
              cores[alerta.tipo]
            )}
          >
            <span className="mt-0.5">{icones[alerta.tipo]}</span>
            <p className="text-xs leading-relaxed">{alerta.mensagem}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
