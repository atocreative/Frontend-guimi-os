"use client"

import { BookOpen, GraduationCap, FileText, PlayCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
  initialSummary?: unknown
  initialMes: number
  initialAno: number
  availableYears: number[]
}

export function ProcessosDashboard({}: Props) {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Processos</h2>
        <p className="text-sm text-muted-foreground">
          Treinamento operacional, procedimentos e materiais de apoio.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full p-3 bg-muted/60">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Em breve</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Esta área será dedicada a treinamentos, procedimentos operacionais padrão
              e materiais de capacitação para a equipe.
            </p>
          </div>
          <Badge variant="outline" className="font-normal mt-2">
            módulo em desenvolvimento
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Procedimentos",
            desc: "Documentação dos fluxos operacionais da empresa.",
          },
          {
            icon: PlayCircle,
            title: "Treinamentos",
            desc: "Vídeos e tutoriais para onboarding e capacitação.",
          },
          {
            icon: FileText,
            title: "Materiais",
            desc: "Manuais, templates e recursos de apoio.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="opacity-70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
