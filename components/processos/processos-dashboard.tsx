"use client"

import { useState } from "react"
import { BookOpen, FileText, PlayCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModalMateriais } from "@/components/processos/modal-materiais"

interface Props {
  userRole: string
  canUpload: boolean
}

export function ProcessosDashboard({ userRole: _userRole, canUpload }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Processos</h2>
          <p className="text-sm text-muted-foreground">
            Treinamento operacional, procedimentos e materiais de apoio.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <FileText className="h-4 w-4" />
          Procedimentos e Materiais
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full p-3 bg-muted/60">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Módulo em desenvolvimento</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Em breve esta área terá checklists, fluxos operacionais e acompanhamento de processos.
              Use o botão acima para acessar os materiais e procedimentos já disponíveis.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Procedimentos",
            desc: "Documentação dos fluxos operacionais da empresa.",
          },
          {
            icon: PlayCircle,
            title: "Treinamentos",
            desc: "Vídeos e tutoriais para onboarding e capacitação.",
          },
          {
            icon: BookOpen,
            title: "Materiais",
            desc: "Manuais, templates e recursos de apoio.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card
            key={title}
            className="opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setModalOpen(true)}
          >
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

      <ModalMateriais
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        canUpload={canUpload}
      />
    </div>
  )
}
