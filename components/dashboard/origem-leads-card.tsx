"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface OrigemLead {
  origem: string
  quantidade: number
  percentual: number
  valor: number
}

const COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-yellow-500", "bg-red-500",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function OrigemLeadsCard() {
  const { data, isLoading } = useSWR<{ origens: OrigemLead[]; totalLeads: number }>(
    "/api/comercial/analytics/origens",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const origens = data?.origens ?? []
  const totalLeads = data?.totalLeads ?? 0

  if (origens.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Users className="mb-2 h-6 w-6 opacity-30" />
          <p className="text-sm font-medium text-muted-foreground">Origem dos Leads</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Origem dos Leads</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalLeads} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {origens.slice(0, 6).map((o, i) => (
          <div key={o.origem} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                <span className="font-medium">{o.origem}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{o.quantidade} leads</span>
                <span className="font-semibold text-foreground">{o.percentual}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${COLORS[i % COLORS.length]} transition-all duration-500`}
                style={{ width: `${o.percentual}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
