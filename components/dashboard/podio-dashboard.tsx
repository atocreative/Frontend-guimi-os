"use client"

import { useEffect, useMemo, useState } from "react"
import { Trophy } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { mockColaboradores, mockIndicadoresTime } from "@/app/(dashboard)/data/mock"
import type { ColaboradorResumo } from "@/types/colaboradores"
import type { UsuarioSistema } from "@/types/usuarios"

const medalhas = ["🥇", "🥈", "🥉"] as const

function getInitials(name: string) {
  return name
    .split(" ")
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function buildColaboradores(usuarios: UsuarioSistema[]): ColaboradorResumo[] {
  return usuarios.map((usuario) => {
    const mockColaborador = mockColaboradores.find(
      (item) => item.email.toLowerCase() === usuario.email.toLowerCase()
    )
    const mockIndicador =
      mockIndicadoresTime.find(
        (item) => item.nome.toLowerCase() === usuario.name.toLowerCase()
      ) ??
      mockIndicadoresTime.find(
        (item) =>
          mockColaborador &&
          item.nome.toLowerCase() === mockColaborador.nome.toLowerCase()
      )

    return {
      id: usuario.id,
      nome: usuario.name,
      email: usuario.email,
      cargo: usuario.jobTitle ?? mockColaborador?.cargo ?? "Cargo não informado",
      avatar: mockColaborador?.avatar ?? getInitials(usuario.name),
      role: usuario.role,
      ativo: usuario.active,
      tempoEmpresa: mockColaborador?.tempoEmpresa ?? "Novo no time",
      telefone: mockColaborador?.telefone ?? "Não informado",
      nivel: mockColaborador?.nivel ?? "Iniciante",
      nivelProgresso: mockColaborador?.nivelProgresso ?? 0,
      sequenciaDias: mockColaborador?.sequenciaDias ?? 0,
      pontosMes: mockColaborador?.pontosMes ?? 0,
      metaMes: mockIndicador?.metaMes ?? mockColaborador?.metaMes ?? 0,
      realizadoMes:
        mockIndicador?.faturamentoMes ?? mockColaborador?.realizadoMes ?? 0,
      vendasMes: mockIndicador?.vendasMes ?? 0,
      ticketMedio: mockIndicador?.ticketMedio ?? 0,
      taxaConversao: mockIndicador?.taxaConversao ?? 0,
      conquistasDesbloqueadas: mockColaborador?.conquistasDesbloqueadas ?? [],
    }
  })
}

export function PodioDashboard() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/usuarios")
        if (!res.ok) return
        const data = await res.json()
        setUsuarios(data.usuarios)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const top3 = useMemo(() => {
    const colaboradores = buildColaboradores(usuarios)
    return [...colaboradores]
      .sort((a, b) => {
        if (b.pontosMes !== a.pontosMes) return b.pontosMes - a.pontosMes
        return b.realizadoMes - a.realizadoMes
      })
      .slice(0, 3)
  }, [usuarios])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4" />
          Ranking do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : top3.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhum colaborador encontrado.
          </p>
        ) : (
          top3.map((colaborador, index) => (
            <div
              key={colaborador.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <span className="text-lg">{medalhas[index]}</span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white">
                  {colaborador.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{colaborador.nome}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {colaborador.cargo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{colaborador.pontosMes}</p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
