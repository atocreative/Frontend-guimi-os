"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const faqItems = [
  {
    question: "Como faço login no sistema?",
    answer:
      "Acesse a tela de login, insira seu e-mail e senha cadastrados e clique em Entrar. Se a sua conta tiver autenticação de dois fatores (2FA) ativada, o sistema solicitará o código do aplicativo autenticador antes de liberar o acesso.",
  },
  {
    question: "Como criar projeto ou tarefa?",
    answer:
      "Acesse Agenda e Tarefas, clique em Nova Tarefa e preencha os campos obrigatórios. Perfis ADMIN podem escolher o responsável; colaboradores criam tarefas para si mesmos.",
  },
  {
    question: "Como entendo o dashboard?",
    answer:
      "O dashboard mostra indicadores operacionais e financeiros, além das tarefas prioritárias do dia. Os cartões principais resumem produtividade, pendências e visão geral da operação.",
  },
  {
    question: "Como funciona o ranking e pontuação?",
    answer:
      "O ranking exibe os colaboradores ordenados pela pontuação acumulada no período selecionado (diário, semanal ou mensal). Cada tarefa concluída gera pontos conforme a prioridade e o prazo — tarefas urgentes entregues no prazo valem mais.",
  },
  {
    question: "Como ganhar pontos na gamificação?",
    answer:
      "Você ganha pontos ao concluir tarefas dentro do prazo, manter sequências de produtividade e atingir metas mensais. Tarefas de alta prioridade e entregas antecipadas oferecem bônus de pontuação.",
  },
  {
    question: "Quanto tempo tarefas concluídas ficam visíveis?",
    answer:
      "Tarefas concluídas permanecem visíveis nos filtros de histórico por 30 dias. Após esse período, são arquivadas e acessíveis somente via exportação ou relatórios.",
  },
  {
    question: "Como redefinir minha senha?",
    answer:
      "Na tela de login, clique em Esqueci minha senha, informe seu e-mail e aguarde as instruções. O link de redefinição é válido por 2 horas. Caso não encontre o e-mail, verifique a pasta de spam.",
  },
  {
    question: "Como funcionam os níveis Bronze, Prata e Ouro?",
    answer:
      "Os níveis representam o progresso acumulado de pontuação. Bronze é o nível inicial; ao atingir 500 pontos você avança para Prata; com 2 000 pontos você alcança Ouro. Cada nível desbloqueia badges exclusivos no perfil.",
  },
  {
    question: "O sistema salva automaticamente?",
    answer:
      "Sim. Formulários de tarefas e checklists salvam rascunhos automaticamente enquanto você preenche. Dados de configuração e preferências são persistidos imediatamente ao confirmar.",
  },
  {
    question: "Quem pode visualizar relatórios financeiros?",
    answer:
      "Apenas usuários com perfil GESTOR ou ADMIN têm acesso ao módulo financeiro e seus relatórios. Colaboradores enxergam somente as informações pertinentes à sua operação diária.",
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
