"use client"

import { useState } from "react"
import { BookOpen, FileText, PlayCircle, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModalMateriais } from "@/components/processos/modal-materiais"

interface Props {
  userRole: string
  canUpload: boolean
  isBlocked?: boolean
}

export function ProcessosDashboard({ userRole: _userRole, canUpload, isBlocked }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  if (isBlocked) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Processos</h2>
          <p className="text-sm text-muted-foreground">
            Treinamento operacional, procedimentos e materiais de apoio.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="rounded-full bg-muted p-5">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">Em Breve</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Em breve — funcionalidade restrita.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="mt-2">
              Acesso Restrito
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          className="gap-2 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <FileText className="h-4 w-4" />
          {canUpload ? "Gerenciar Materiais" : "Ver Materiais"}
        </Button>
      </div>

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
            className="cursor-pointer hover:bg-muted/40 transition-colors"
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
