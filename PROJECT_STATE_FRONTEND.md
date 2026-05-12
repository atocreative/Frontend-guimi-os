# PROJECT_STATE_FRONTEND.md
Estado operacional do frontend GuimiCell OS. Leia antes de qualquer mudança.

## 1. ARQUITETURA ATUAL
- **Framework:** Next.js 16.2.2 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui (obrigatório)
- **State:** Zustand (gamificação) + React Context (menu config)
- **Auth:** NextAuth v5 + JWT
- **DB:** PostgreSQL (backend) - frontend é cliente apenas

## 2. IMPLEMENTADO (Sprint 0-2)
✅ Dashboard admin: KPI cards, gráficos reais, filtros mês/ano
✅ Integrações: 3 conectadas (FoneNinja API, XLSX, BD Local)
✅ RBAC: Menu config persistido, logout limpa estado
✅ Loading states: KpiSkeleton, GraficoVazio
✅ Sync system: useSyncStatus hook + integrations-service.ts
✅ Backend integration: POST /api/integrations/foneninja/sync funciona

## 3. COMPONENTES CRÍTICOS
```
├── components/
│   ├── dashboard/
│   │   ├── dashboard-admin.tsx (MAIN - 321 linhas, estado complexo)
│   │   ├── kpi-card.tsx
│   │   ├── kpi-skeleton.tsx
│   │   ├── grafico-financeiro.tsx
│   │   ├── grafico-vazio.tsx
│   │   └── [outros painéis]
│   ├── layout/
│   │   ├── app-sidebar.tsx (RBAC + menu config dinâmico)
│   │   └── header.tsx (logout handler)
│   └── ui/ (shadcn - não alterar)
├── hooks/
│   ├── use-sync-status.ts (maneja state + chama API real)
│   ├── use-gamificacao-feedback.ts
│   └── use-menu-visibility.ts
├── lib/
│   ├── services/
│   │   ├── integrations-service.ts (sync real)
│   │   ├── dashboard-summary.ts (fetch KPIs)
│   │   └── backend-service.ts
│   ├── menu-config-context.ts (RBAC context)
│   ├── logout-helper.ts (limpa localStorage on logout)
│   └── feature-flags.ts
└── app/
    └── (dashboard)/
        ├── page.tsx (admin/colaborador selector)
        ├── integracoes/page.tsx (sync UI - 190 linhas)
        └── [outras rotas]
```

## 4. FLUXOS REAIS
**Logout → RBAC limpo:**
header.tsx → signOut() → logout-helper.ts → clearMenuConfigFromStorage() → localStorage limpo

**Dashboard filtros:**
dashboard-admin.tsx → [mês/ano selects] → fetchDados() → GET /api/dashboard/summary?month=X&year=Y → renderiza KPIs

**Sincronização:**
integracoes/page.tsx → [Sincronizar Agora] → useSyncStatus.sync() → syncFoneNinja() → POST /api/integrations/foneninja/sync → success/error badge

## 5. INTEGRAÇÕES REAIS
- **POST /api/integrations/foneninja/sync** → integrations-service.ts chama
  - Response: `{success, message, data: {recordsProcessed, duration, timestamp}}`
  - Usado por: use-sync-status.ts
  - Exibido em: integracoes/page.tsx (histórico + status)

- **GET /api/dashboard/summary** → dashboard-summary.ts chama
  - Params: startDate, endDate (ou month/year)
  - Response: {faturamentoMes, lucroLiquidoMes, ticketMedio, grafico[], ...}
  - Usado por: dashboard-admin.tsx

## 6. PROVIDERS E HOOKS OFICIAIS
**Providers (obrigatórios):**
- MenuConfigProvider (app/providers.tsx) - RBAC dinâmico
- SidebarProvider (shadcn) - layout sidebar
- ThemeProvider (next-themes) - dark/light mode

**Hooks (use esses, não criar novos):**
- useSyncStatus() → state, isLoading, logs, lastSyncTime, sync()
- useMenuConfig() → items, updateItem, saveToStorage
- useGameificacaoFeedback() → notifyTaskCompleted, notifyTaskCompletionError
- useMenuVisibility() → canAccessMenuItem

**NÃO crie novos hooks** se já existe um que faz coisa similar.

## 7. REGRAS UI/UX OBRIGATÓRIAS
1. **shadcn/ui sempre** - Card, Button, Badge, Select, Skeleton
2. **Cores:** Verde (sucesso), Vermelho (erro), Azul (sincronizando), Amarelo (warning)
3. **Loading:** KpiSkeleton ou animate-spin no ícone
4. **Empty state:** Mostrar ícone + mensagem (ver grafico-vazio.tsx)
5. **Toast:** Usar sonner (não useToast do shadcn, não existe)
6. **Tabelas:** Use shadcn Table + shadcn Pagination

## 8. O QUE NÃO DEVE SER ALTERADO
- ❌ MenuConfigProvider estrutura (RBAC é crítico)
- ❌ logout-helper.ts (limpa localStorage, essencial)
- ❌ app-sidebar.tsx lógica de acesso (dinâmica por feature flags)
- ❌ auth flow (NextAuth + JWT)
- ❌ shadcn/ui componentes (usar como estão)
- ❌ Estrutura de pastas componentes

## 9. PADRÃO SHADCN/UI OBRIGATÓRIO
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Sempre use composição, nunca crie "CustomCard" wrapper
export function MyComponent() {
  return (
    <Card>
      <CardHeader><CardTitle>Title</CardTitle></CardHeader>
      <CardContent>...</CardContent>
    </Card>
  )
}
```

## 10. ESTRUTURA DASHBOARD ATUAL
```
DashboardAdmin (filtros mês/ano no topo)
├── KPI Cards (linha 1: 4 cards)
│   ├── Faturamento Dia (skeleton se loading)
│   ├── Faturamento Mês
│   ├── Lucro Líquido (destaque)
│   └── Ticket Médio
├── KPI Cards (linha 2: 4 cards)
│   ├── Taxa Conversão
│   ├── Total Despesas
│   ├── Estoque Total
│   └── Saldo em Caixa (destaque)
├── Gráficos (2 colunas)
│   ├── Evolução Mensal (com dados reais ou empty state)
│   └── Evolução Semanal
└── Painéis (3 colunas)
    ├── Leaderboard
    ├── Painel Tarefas
    └── Painel Compromissos
```

## 11. SISTEMA DE SINCRONIZAÇÃO ATUAL
**Hook: useSyncStatus()**
```ts
const { state, isLoading, logs, lastSyncTime, sync } = useSyncStatus()
// state: "idle" | "syncing" | "success" | "error"
// logs: Array<{id, timestamp, status, message, duration}>
// sync(): Promise<void> - chama POST /api/integrations/foneninja/sync
```

**Integrações listadas (hardcoded, ok):**
- FoneNinja API (últimos 2min)
- FoneNinja XLSX (1 dia atrás)
- Banco Local (agora)

**Histórico de sync:**
- Exibe últimas N sincronizações
- Mostra: timestamp, status (sucesso/erro), duração, mensagem
- Real-time: timestamp de cada sync vem do backend

## 12. PRÓXIMAS PRIORIDADES
1. Dashboard: Adicionar badge "Sincronizados em [horário]"
2. Real-time sync status no Dashboard (pull a cada 5min ou SSE)
3. Gráficos: Dados reais do período (já conectado)
4. Comercial página: Ativar (desativada - comece aqui depois)
5. Performance: Memoize dashboard-admin (complexo, tem 321 linhas)

## 13. ANTI-PATTERNS PROIBIDOS
- ❌ Criar novo provider se pode usar Context
- ❌ Criar novo hook se pode usar useState
- ❌ Custom "Card" wrapper (use shadcn/ui Card direto)
- ❌ Prop drilling (use Context ou hooks)
- ❌ Fetch direto em componentes (use services/ ou hooks/)
- ❌ setTimeout para sync (use useEffect dependency arrays)
- ❌ Duplicar código KPI/gráfico (abstrair se repetem 2x+)
- ❌ Novo arquivo .css (Tailwind apenas)

## 14. COMO CONTINUAR SEM REPLANEJAR
1. **Antes de alterar:** Verifique arquitetura no arquivo (acima)
2. **Não é bug?** Procure em componentes existentes similar
3. **Alteração UI?** Confirme padrão shadcn/ui (seção 9)
4. **Novo hook?** Verifique se algo similar existe (seção 6)
5. **API call?** Use services/ (integrations-service, dashboard-summary, etc)
6. **Build falha?** Verifique imports (shadcn paths, não custom)
7. **Teste rápido:** `npm run build` antes de commit

**Commits recentes:** 
- 3e239e8: feat(sprint2): connect integrations to real backend sync
- 04c9d30: feat(sprint1.5): implement functional sync system
- 1ad95b1: fix(rbac-persistence): centralize logout

---
**Última atualização:** 2026-05-11
**Estado:** Pronto para continuar - nenhum planning necessário
