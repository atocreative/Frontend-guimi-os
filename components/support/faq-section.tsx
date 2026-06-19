"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const faqItems = [
  {
    question: "Como faço login no sistema?",
    answer:
      "Acesse a tela de login com seu e-mail e senha cadastrados. O sistema exibe um desafio de segurança matemático (CAPTCHA) que deve ser respondido antes de entrar. Contas ADMIN exigem também autenticação de dois fatores (2FA) via Google Authenticator ou Authy — após a senha, insira o código de 6 dígitos gerado pelo aplicativo. O código expira a cada 30 segundos; se o login falhar, aguarde o próximo ciclo.",
  },
  {
    question: "O que aparece no Dashboard?",
    answer:
      "O conteúdo varia conforme o perfil. ADMIN/SUPER_USER veem KPIs financeiros em tempo real (faturamento do dia e do mês, lucro líquido real, total de vendas, ticket médio, margem líquida, meta mensal e taxa de conversão), alertas operacionais priorizados e o ranking de colaboradores. COLABORADOR vê uma visão individual com suas tarefas pendentes, concluídas no mês e taxa de conclusão. Use o seletor de período no topo para navegar entre datas.",
  },
  {
    question: "O que é o Lucro Líquido Real?",
    answer:
      "O Lucro Líquido Real é calculado pelo servidor combinando dados do FoneNinja (vendas) e do Meu Assessor (despesas operacionais e fixas). Difere do lucro bruto pois desconta todas as despesas. O frontend exibe o valor exatamente como calculado pelo backend — nenhum recálculo é feito no navegador. Visível apenas para ADMIN e GERENTE.",
  },
  {
    question: "Como criar e gerenciar tarefas?",
    answer:
      "Acesse Agenda e Tarefas e clique em 'Nova Tarefa'. Preencha título (obrigatório), descrição (mínimo 5 caracteres), prioridade (Nenhuma, Baixa, Média ou Alta), prazo, recorrência (Não recorrente, Diária, Semanal ou Mensal) e responsável. ADMIN e GERENTE podem atribuir tarefas a qualquer colaborador. Para concluir uma tarefa, clique no ícone de conclusão — tarefas atrasadas exigem justificativa de no mínimo 50 caracteres. Tarefas recorrentes geram automaticamente a próxima ocorrência ao serem concluídas.",
  },
  {
    question: "Como funciona o filtro de data nos dashboards?",
    answer:
      "O filtro de data afeta todos os KPIs e gráficos da tela. Navegue entre meses usando as setas, clique em 'Hoje' para voltar ao dia atual, ou selecione um dia específico no calendário. Por padrão o dashboard abre no dia corrente. O período selecionado é refletido na URL (parâmetros m, y, d) e é preservado ao recarregar a página.",
  },
  {
    question: "Como funciona o módulo Financeiro?",
    answer:
      "O Financeiro exibe dados consolidados de FoneNinja e Meu Assessor: faturamento, despesas por categoria, lucro líquido e histórico mensal. Filtre por mês ou dia. A aba 'Consolidado' oferece análise detalhada com gráficos de evolução. Alertas aparecem automaticamente quando há desvios (margem baixa, CMV elevado). Acesso restrito a ADMIN e GERENTE.",
  },
  {
    question: "Como funciona o módulo Comercial?",
    answer:
      "O Comercial exibe dados em tempo real do CRM Kommo: leads ativos e ganhos, taxa de conversão, chats pendentes e histórico por período. O botão 'Abrir Kommo' leva diretamente ao CRM. Alertas de atenção (chats acumulados, leads sem follow-up) aparecem automaticamente na Central de Alertas do Dashboard. Acesso restrito a GERENTE e ADMIN.",
  },
  {
    question: "Como funciona o módulo Operação?",
    answer:
      "Operação exibe o estoque sincronizado do FoneNinja: resumo de inventário, tabela de produtos com filtros por nome e status, dispositivos mais vendidos por marca e alertas de estoque crítico. O botão 'Sincronizar' atualiza os dados manualmente. Acessível a todos os perfis, mas dados de custo e margem são visíveis apenas para ADMIN e GERENTE.",
  },
  {
    question: "Como funciona o Ranking?",
    answer:
      "O Ranking exibe a posição dos colaboradores por pontuação no período selecionado (Mês ou Geral). Pontos são obtidos ao concluir tarefas — prioridades mais altas e conclusões dentro do prazo geram mais pontos. O ranking é visível para todos os perfis. A tela Colaboradores complementa com detalhes de desempenho individual.",
  },
  {
    question: "Quem pode acessar o quê no sistema?",
    answer:
      "COLABORADOR: Dashboard individual, Agenda e Tarefas, Operação, Ranking e Suporte. GERENTE (Pedro Ribas): adiciona Comercial e Financeiro. ADMIN (Gui): acesso completo incluindo Configurações e Processos. SUPER_USER (Developer): visão total com Dashboard Development e controle de feature flags. Rotas protegidas redirecionam automaticamente para o Dashboard quando o perfil não tem permissão.",
  },
  {
    question: "Como gerenciar usuários?",
    answer:
      "Em Configurações (acesso ADMIN), aba Usuários, você vê todos os colaboradores cadastrados com nome, e-mail, cargo, perfil e data de cadastro. Clique nos três pontos ao lado de um usuário para editar nome, cargo, senha ou desativar a conta. O botão 'Novo Colaborador' cria um novo usuário com perfil COLABORADOR ou GESTOR. A aba Sistema exibe o status das integrações ativas.",
  },
  {
    question: "O que é o módulo Processos?",
    answer:
      "Processos centraliza materiais operacionais da empresa: manuais, procedimentos, templates e materiais de treinamento. Acessível pelo botão 'Procedimentos e Materiais'. Todos os colaboradores podem visualizar o conteúdo disponibilizado pelo ADMIN.",
  },
  {
    question: "Minha sessão expirou, o que fazer?",
    answer:
      "O sistema usa tokens JWT com expiração automática. Quando a sessão expira, você é redirecionado para o login. Faça login novamente com e-mail, senha, CAPTCHA e, se for ADMIN, o código 2FA. Se o problema persistir após o login, limpe os cookies do navegador (Ctrl+Shift+Delete) e tente novamente.",
  },
  {
    question: "Os dados são atualizados automaticamente?",
    answer:
      "Sim. O Dashboard financeiro atualiza automaticamente ao navegar entre períodos. O módulo Comercial exibe dados em tempo real do Kommo. O módulo Operação tem botão 'Sincronizar' para atualização manual do estoque. Use o ícone de refresh (⟳) disponível em cada tela para forçar uma atualização imediata.",
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
