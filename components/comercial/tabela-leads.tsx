'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MessageSquare, Clock } from 'lucide-react'
import type { Lead } from '@/app/(dashboard)/comercial/data/mock'

const temperaturaLabel: Record<string, string> = {
  QUENTE: 'Quente',
  MORNO: 'Morno',
  FRIO: 'Frio',
}

const temperaturaCor: Record<string, string> = {
  QUENTE: 'bg-red-500/10 text-red-600',
  MORNO: 'bg-amber-500/10 text-amber-600',
  FRIO: 'bg-blue-500/10 text-blue-600',
}

const etapaLabel: Record<string, string> = {
  novo_contato: 'Novo Contato',
  em_negociacao: 'Em Negociação',
  proposta_enviada: 'Proposta Enviada',
  fechado_ganho: 'Fechado Ganho',
  fechado_perdido: 'Fechado Perdido',
}

const etapaCor: Record<string, string> = {
  novo_contato: 'bg-blue-500/10 text-blue-600',
  em_negociacao: 'bg-amber-500/10 text-amber-600',
  proposta_enviada: 'bg-purple-500/10 text-purple-600',
  fechado_ganho: 'bg-emerald-500/10 text-emerald-600',
  fechado_perdido: 'bg-red-500/10 text-red-600',
}

function brl(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

interface TabelaLeadsProps {
  leads: Lead[]
  filtro?: 'todos' | 'ativos' | 'ganhos' | 'perdidos'
}

export function TabelaLeads({ leads, filtro = 'todos' }: TabelaLeadsProps) {
  const filtered = leads.filter((lead) => {
    if (filtro === 'ativos') return lead.etapa !== 'fechado_ganho' && lead.etapa !== 'fechado_perdido'
    if (filtro === 'ganhos') return lead.etapa === 'fechado_ganho'
    if (filtro === 'perdidos') return lead.etapa === 'fechado_perdido'
    return true
  })

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Temperatura</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Último Contato</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell className="text-sm">{lead.telefone}</TableCell>
                <TableCell className="text-sm">{lead.produto}</TableCell>
                <TableCell className="font-semibold text-emerald-600">{brl(lead.valor)}</TableCell>
                <TableCell>
                  <Badge className={etapaCor[lead.etapa]} variant="secondary">
                    {etapaLabel[lead.etapa]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={temperaturaCor[lead.temperatura]} variant="secondary">
                    {temperaturaLabel[lead.temperatura]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{lead.origem}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{lead.ultimoContato}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
