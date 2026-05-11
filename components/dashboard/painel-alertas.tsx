import { AlertTriangle, Info, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ALERT_COLORS } from "@/lib/colors-config"

interface Alerta {
  id: string
  tipo: "urgente" | "atencao" | "info"
  mensagem: string
}

export function PainelAlertas({ alertas }: { alertas: Alerta[] }) {
  const icones = {
    urgente: <Zap className={`h-3.5 w-3.5 ${ALERT_COLORS.urgente.icon}`} />,
    atencao: <AlertTriangle className={`h-3.5 w-3.5 ${ALERT_COLORS.atencao.icon}`} />,
    info: <Info className={`h-3.5 w-3.5 ${ALERT_COLORS.info.icon}`} />,
  }

  const cores = {
    urgente: ALERT_COLORS.urgente.bg,
    atencao: ALERT_COLORS.atencao.bg,
    info: ALERT_COLORS.info.bg,
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
