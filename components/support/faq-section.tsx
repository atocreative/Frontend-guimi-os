"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const faqItems = [
  {
    question: "Como faço login no sistema?",
    answer:
      "Acesse a tela de login com seu e-mail e senha. Contas com perfil ADMIN exigem autenticação de dois fatores (2FA) via aplicativo autenticador (Google Authenticator, Authy). Após inserir a senha, o sistema solicitará o código de 6 dígitos. O token expira a cada 30 segundos — se o login falhar, aguarde o próximo código.",
  },
  {
    question: "O que aparece no Dashboard?",
    answer:
      "O dashboard exibe KPIs financeiros em tempo real (faturamento do dia, faturamento do mês, lucro líquido real e total de vendas), alertas operacionais priorizados, ranking de colaboradores, tarefas pendentes e gráfico de evolução financeira. Os dados financeiros vêm integrados do FoneNinja e Meu Assessor. Use o filtro de data no topo para visualizar outros períodos.",
  },
  {
    question: "O que é o Lucro Líquido Real?",
    answer:
      "O Lucro Líquido Real é calculado pelo backend somando dados do FoneNinja (vendas) com dados do Meu Assessor (despesas administrativas e fixas). Difere do lucro bruto pois desconta todas as despesas operacionais. O frontend apenas exibe o valor calculado pelo servidor — nunca recalcula financeiro.",
  },
  {
    question: "Como funciona o filtro de data nos dashboards?",
    answer:
      "O filtro de data afeta todos os KPIs e gráficos da tela. Você pode navegar entre meses clicando nas setas de mês, usar o botão 'Hoje' para voltar ao dia atual, ou selecionar um dia específico no calendário para ver o faturamento daquele dia. Por padrão, o dashboard abre no dia de hoje.",
  },
  {
    question: "Como criar e gerenciar tarefas?",
    answer:
      "Acesse Agenda e Tarefas e clique em 'Nova Tarefa'. Defina título, prioridade (baixa, média, alta, urgente), prazo e responsável. ADMIN pode atribuir tarefas a qualquer colaborador; colaboradores criam tarefas apenas para si. Tarefas concluídas geram pontos na gamificação conforme a prioridade e o cumprimento do prazo.",
  },
  {
    question: "Como funciona o módulo Financeiro?",
    answer:
      "O módulo Financeiro exibe dados consolidados de FoneNinja + Meu Assessor: faturamento, lucro bruto, total de gastos e lucro líquido. Você pode filtrar por mês ou dia. O gráfico de pizza mostra despesas por categoria. A seção 'Monitoramento' exibe alertas de desvios (margem baixa, despesas elevadas) e as entradas recentes. Apenas ADMIN e GERENTE têm acesso.",
  },
  {
    question: "Como funciona o módulo Comercial?",
    answer:
      "O Comercial exibe dados em tempo real do CRM Kommo: leads ativos, leads ganhos, leads perdidos, taxa de conversão e pipeline por etapa. O botão 'Abrir Kommo' leva diretamente ao CRM. Os alertas operacionais (chats sem resposta, leads esquecidos) aparecem automaticamente quando há desvios. Os dados de histórico permitem visualizar evolução por mês ou dia.",
  },
  {
    question: "Como funciona o módulo Operação?",
    answer:
      "Operação exibe o estoque sincronizado do FoneNinja: resumo de inventário, tabela de produtos com filtros (busca, status, tipo), produtos mais vendidos e alertas de estoque crítico. O botão 'Sincronizar' atualiza o estoque manualmente. Dados financeiros do estoque (custo, margem) são visíveis apenas para ADMIN e GERENTE.",
  },
  {
    question: "Como funciona o Ranking e a Gamificação?",
    answer:
      "O Ranking ordena colaboradores por pontuação no período selecionado (diário, semanal ou mensal). Pontos são ganhos ao concluir tarefas: urgentes valem mais, conclusões antecipadas dão bônus, atrasos penalizam. O perfil de cada colaborador exibe badges desbloqueados (Bronze, Prata, Ouro) e o histórico de atividade. Streaks (dias consecutivos de atividade) também somam pontos.",
  },
  {
    question: "Quem pode acessar o quê no sistema?",
    answer:
      "COLABORADOR: Agenda/Tarefas e Suporte. GERENTE: adiciona Financeiro, Comercial e Operação. ADMIN: acesso completo incluindo Configurações, Processos e dados financeiros detalhados. SUPER_USER: visão total do sistema com controle de feature flags. As rotas protegidas redirecionam automaticamente se o perfil não tiver permissão.",
  },
  {
    question: "Como gerenciar usuários e configurações?",
    answer:
      "Em Configurações (acesso ADMIN), você pode criar novos usuários, alterar senhas, configurar perfis e ativar/desativar o 2FA. A aba Sistema exibe o status das integrações (FoneNinja, Meu Assessor, Kommo). Alterações de senha enviam notificação ao usuário afetado.",
  },
  {
    question: "O que é o módulo Processos?",
    answer:
      "Processos centraliza materiais operacionais da empresa: manuais, procedimentos, templates e vídeos de treinamento. ADMIN e GERENTE podem fazer upload de arquivos. Todos os colaboradores podem visualizar e baixar. Acesse pelo botão 'Procedimentos e Materiais' na tela de Processos.",
  },
  {
    question: "Minha sessão expirou, o que fazer?",
    answer:
      "O sistema usa tokens JWT com expiração curta por segurança. Quando a sessão expira, você é redirecionado automaticamente para o login. Basta entrar novamente com e-mail, senha e (se ADMIN) o código 2FA. Se o problema persistir, limpe os cookies do navegador e tente novamente.",
  },
  {
    question: "Os dados financeiros são atualizados automaticamente?",
    answer:
      "Sim. O dashboard financeiro atualiza a cada 60 segundos para o mês atual. Meses anteriores usam cache de 5 minutos. O módulo Comercial atualiza a cada 30 segundos. Você também pode forçar a atualização clicando no ícone de refresh disponível em cada tela.",
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
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen ? (
                <div className="border-t px-4 py-3 text-sm text-muted-foreground leading-relaxed">
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
