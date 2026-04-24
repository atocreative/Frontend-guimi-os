import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { mockOrigemLeads } from "@/app/(dashboard)/data/mock"

type Origem = (typeof mockOrigemLeads)[number]

const coresOrigem: Record<string, string> = {
  Instagram: "bg-purple-500",
  Indicação: "bg-emerald-500",
  WhatsApp: "bg-green-500",
  Google: "bg-blue-500",
}

export function OrigemLeads({ dados }: { dados: Origem[] }) {
  const maxLeads = Math.max(...dados.map((d) => d.leads))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Origem dos Leads
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Canal vs taxa de conversão
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {dados
          .sort((a, b) => b.conversao - a.conversao)
          .map((item) => (
            <div key={item.origem} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    coresOrigem[item.origem] ?? "bg-zinc-400"
                  )} />
                  <span className="text-xs font-medium">{item.origem}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.leads} leads</span>
                  <span className={cn(
                    "font-semibold",
                    item.conversao >= 40
                      ? "text-emerald-500"
                      : item.conversao >= 30
                      ? "text-amber-500"
                      : "text-red-500"
                  )}>
                    {item.conversao}% conv.
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    coresOrigem[item.origem] ?? "bg-zinc-400"
                  )}
                  style={{ width: `${(item.leads / maxLeads) * 100}%` }}
                />
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
