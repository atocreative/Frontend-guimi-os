"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const faqItems = [
  {
    question: "Como faço login?",
    answer: "Use seu e-mail e senha. Se sua conta exigir segurança adicional, o sistema abrirá a etapa de verificação com o código 2FA antes de entrar no dashboard.",
  },
  {
    question: "Como criar projeto ou tarefa?",
    answer: "Acesse Agenda e Tarefas, clique em Nova Tarefa e preencha os campos obrigatórios. Perfis ADMIN podem escolher o responsável; colaboradores criam tarefas para si mesmos.",
  },
  {
    question: "Como entendo o dashboard?",
    answer: "O dashboard mostra indicadores operacionais e financeiros, além das tarefas prioritárias do dia. Os cartões principais resumem produtividade, pendências e visão geral da operação.",
  },
  {
    question: "Como funciona a gamificação?",
    answer: "Ao concluir tarefas válidas, o sistema atualiza ranking, progresso de nível e badges quando a integração de gamificação estiver disponível. Se o backend estiver indisponível, a interface mostra fallback seguro.",
  },
] as const

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perguntas frequentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div key={item.question} className="rounded-xl border">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex((current) => (current === index ? null : index))}
              >
                <span className="text-sm font-medium">{item.question}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen ? (
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                  {item.answer}
                </div>
              ) : null}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
