'use client'

import { AlertTriangle, MessageSquare, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/app/(dashboard)/comercial/data/mock'

interface ChatsSemRespostaProps {
  leads: Lead[]
}

export function ChatsSemResposta({ leads }: ChatsSemRespostaProps) {
  // Filtra leads que não têm follow-up agendado e têm > 3 dias parado
  const chatsPendentes = leads.filter(
    (l) => !l.proximoFollowUp && l.diasParado >= 3 && l.etapa !== 'fechado_ganho' && l.etapa !== 'fechado_perdido'
  )

  if (chatsPendentes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            ✅ Nenhum chat sem resposta. Tudo em dia!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-base">Chats Sem Resposta</CardTitle>
          <Badge variant="destructive">{chatsPendentes.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {chatsPendentes.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{lead.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{lead.telefone}</span>
                <span className="text-xs text-red-600 font-semibold">{lead.diasParado}d parado</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
