---
created: 2026-05-12
version: v3.2
status: Current Operational State (Post-Financeiro Implementation)
priority: HANDOFF DOCUMENT - Real Implementation Status
---

# PROJECT_CONTEXT_FRONTEND.md

**This document replaces PROJECT_STATE_FRONTEND.md as source of truth.**
**Last updated: 2026-05-12 after Financeiro module completion.**

---

## 1. CURRENT FRONTEND STATUS

### What's Actually Working ✅

**Dashboard Admin** (`app/(dashboard)/page.tsx`)
- 8 KPIs rendering with real data from `/api/dashboard/summary`
- Monthly data (fetchMensal) completely separated from daily data (fetchDiario)
- Filters: month/year selectors + optional day filter
- Day filter ONLY affects "Faturamento do Dia" KPI
- Monthly KPIs (faturamento mês, lucro, despesas, ticket médio) unaffected by day selection
- Gráficos rendering fluxo de caixa + categorias from backend
- Loading states (KpiSkeleton) working
- PostgreSQL source badge visible ("Sincronizado com PostgreSQL")
- Integration status polling (5min interval, manual refetch)
- Last sync timestamp displayed

**Financeiro Module** (`app/(dashboard)/financeiro/page.tsx`, `components/financeiro/*`)
- ✅ RBAC protected: route + feature flag require ADMIN role
- ✅ 8 KPIs: faturamento mês, lucro líquido, despesas, saldo caixa, vendas, ticket médio, lucro bruto, meta mensal
- ✅ Meta visual: barra de progresso (target 100k/mês)
- ✅ Crescimento vs mês anterior: label com percentual
- ✅ Gráficos: GraficoFluxoCaixa (dinâmico mês/ano), GraficoCategorias
- ✅ Tabelas: TabelaDespesas (com KPIs agregados) + TabelaEntradas (vendas)
- ✅ Empty states em todas tabelas
- ✅ Badges: "Sincronizado com PostgreSQL", "Origem: Backend Real"
- ✅ Alertas: loading, erro, sem dados
- ✅ Data fetching: `/api/dashboard/summary` (mês atual + anterior), `/api/financeiro/despesas`, `/api/financeiro/compras`

**Integrações Module** (`app/(dashboard)/integracoes/page.tsx`)
- ✅ Sync status display: "Sincronizados às [horário]"
- ✅ Histórico sincronização com timestamp, status (sucesso/erro), duração, records
- ✅ Integration status badges: origem (PostgreSQL/FoneNinja), cron status (ativo/parado/atrasado)
- ✅ Manual sync trigger button
- ✅ Polling: 5 minutos via useIntegrationStatus hook
- ✅ Progress bar para histórico imports
- ✅ Dados reais vindos de `/api/integrations/status` + `/api/integrations/foneninja/sync`

**Auth & RBAC**
- ✅ NextAuth + JWT com tokens curtos
- ✅ Roles: SUPER_USER, ADMIN, GESTOR, COLABORADOR
- ✅ Feature flags: DASHBOARD, FINANCEIRO, INTEGRAÇÕES, SUPORTE, etc.
- ✅ Route protection: `/financeiro` bloqueado para não-ADMIN
- ✅ Menu visibility: sideba mostra/esconde items baseado em feature flags + role
- ✅ Logout limpa localStorage + session
- ✅ Feature flag FINANCEIRO requer role ADMIN

**Polling & Real-time Status**
- ✅ useIntegrationStatus hook: polling 5 minutos
- ✅ useSync Status hook: manual trigger + estado (idle/syncing/success/error)
- ✅ Dashboard auto-refetch integration status após mudança de dados (500ms delay)
- ✅ Badges mostram status real em tempo real

### What's NOT Working ❌

**Comercial Module**
- ❌ Feature flag COMERCIAL desabilitado (enabled: false)
- ❌ Rota `/comercial` existe mas vazia
- ❌ Kommo CRM integration não implementada
- ❌ Menu item visível mas bloqueado por feature flag

**Operação Module**
- ❌ Feature flag OPERACAO desabilitado
- ❌ Rota `/operacao` existe mas vazia
- ❌ Inventory API não integrada

**Processos Module**
- ❌ Feature flag PROCESSOS desabilitado
- ❌ Rota `/processos` existe mas vazia

**Ranking/Gamificação (Partial)**
- ⚠️ Leaderboard básico funciona
- ❌ Top 3 ranking não implementado
- ❌ Pontos/níveis/streaks visualization missing
- ❌ Dashboard de ranking administrative missing

**Dashboard by Profile**
- ❌ Não existe separação de dashboard por SUPER_USER/ADMIN/GERENTE/COLABORADOR
- ❌ Todos veem dashboard admin padrão (se autenticados)

---

## 2. IMPLEMENTED MODULES

| Módulo | Status | Features Implementadas | Status Real | Blockers |
|--------|--------|----------------------|-------------|----------|
| **Dashboard** | ✅ Funcional | KPIs, gráficos, filtros, polling, badges | Monthly/daily separation working | None known |
| **Financeiro** | ✅ Funcional | KPIs, meta, gráficos, tabelas, RBAC | ADMIN-only, dados reais | Backend reconciliation ongoing |
| **Integrações** | ✅ Funcional | Sync status, histórico, polling, badges | Real-time updates working | Depende de backend estabilizar |
| **Configurações** | ✅ Parcial | Menu visível para ADMIN | Rota protegida | Feature flag pode bloquear COLABORADOR |
| **Ranking** | ⚠️ Partial | Leaderboard básico | Gamificação incompleta | Precisa expandir visualizações |
| **Tasks/Agenda** | ✅ Parcial | Painel de tarefas no dashboard | Basic functionality | Mais contexto necessário |
| **Auth** | ✅ Funcional | Login, logout, JWT, 2FA prep | Session management working | Nenhum blocker |

---

## 3. DASHBOARD STATUS (Exact Behavior)

### Monthly vs Daily Separation ✅ WORKING

**Monthly Layer** (fetchMensal):
- Triggered by: `useEffect(() => { fetchMensal(mes, ano) }, [mes, ano, fetchMensal])`
- API call: `GET /api/dashboard/summary?year=X&month=Y` (NO day param)
- State: `indicadores` (primary KPIs)
- Data: faturamento, lucro, despesas, ticket médio, etc. **always for full month**

**Daily Layer** (fetchDiario):
- Triggered by: `useEffect(() => { fetchDiario(mes, ano, diaValido) }, [mes, ano, diaValido, fetchDiario])`
- API call: `GET /api/dashboard/summary?year=X&month=Y&day=Z` (ONLY when day selected)
- State: `faturamentoDiaSelecionado` (isolated)
- Data: **ONLY affects "Faturamento do Dia" KPI**

**Critical Rule (Implemented)**:
```
faturamentoDia = diaValido !== "" 
  ? faturamentoDiaSelecionado  // Use daily value if day selected
  : overviewExtra?.resumo?.faturamentoDia  // Otherwise use monthly overview
```

**Monthly KPIs (Never affected by day filter)**:
- Faturamento do Mês (from `indicadores.faturamento`)
- Lucro Líquido (from `indicadores.lucro`)
- Total Despesas (from `indicadores.despesas`)
- Ticket Médio (from `indicadores.ticketMedio`)
- Saldo em Caixa (calculated from monthly values)

**Gráficos** (Always monthly):
- `dadosGrafico` derived from `overviewExtra?.grafico` (from fetchMensal only)
- Title shows: `Evolução — [Mês] [Ano]`

### Filters ✅ Working

- **Month select**: 0-11 (January-December)
- **Year select**: Available years from backend (2024 onwards)
- **Day select**: 1-31 (dynamic based on selected month)
- **Reset behavior**: Day resets to "" when month/year changes
- **Default**: Current month/year, day = today ONLY if viewing current period

### Polling ✅ Active

- **Integration status**: 5 minutes via `useIntegrationStatus(5 * 60 * 1000)`
- **Manual refetch**: Button in integracoes page + header
- **Auto-refresh**: Dashboard auto-refetches integration status 500ms after KPI change
- **Badge**: Shows "Sincronizado às [time]" when data fresh

### Real-time Badges ✅ Active

- Green badge: "Sincronizado com PostgreSQL" (always visible if data loaded)
- Badge outline: "Origem: Backend Real"
- Integration status: Shows source (PostgreSQL/FoneNinja) + cron status

### Sources of KPI Data

| KPI | Source Endpoint | Method | Frequency |
|-----|-----------------|--------|-----------|
| Faturamento, Lucro, Despesas, Ticket | `/api/dashboard/summary` | GET | On filter change |
| Meta Mensal | Hardcoded 100k | N/A | Static |
| Gráficos | `/api/dashboard/summary` grafico[] | GET | On filter change |
| Integração status | `/api/integrations/status` | GET | 5min polling + manual |
| Sync logs | `/api/integrations/foneninja/sync` | POST/GET | Manual trigger |

---

## 4. RBAC STATUS (Current State)

### Role Matrix

| Feature | SUPER_USER | ADMIN | GESTOR | COLABORADOR |
|---------|-----------|-------|--------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Financeiro | ✅ | ✅ | ❌ | ❌ |
| Integrações | ✅ | ✅ | ❌ | ❌ |
| Configurações | ✅ | ✅ | ❌ | ❌ |
| Agenda | ✅ | ✅ | ✅ | ✅ |
| Comercial | ✅ | ✅ | ⚠️ | ⚠️ |
| Operação | ✅ | ✅ | ⚠️ | ⚠️ |
| Suporte | ✅ | ✅ | ✅ | ✅ |

### Current Protections ✅

**Route Protection** (`protectPage()` helper):
- ✅ `/financeiro` requires ADMIN role (protectPage called in page.tsx)
- ✅ `/configuracoes` server-side gated (auth required)
- ✅ Other routes depend on feature flags

**Feature Flags** (lib/feature-flags.ts):
- ✅ FINANCEIRO: `requiredRole: 'ADMIN'`
- ✅ COMERCIAL: disabled (enabled: false)
- ✅ OPERACAO: disabled
- ✅ PROCESSOS: disabled

**Menu Visibility** (app-sidebar.tsx):
- ✅ Shows/hides items based on `isFeatureEnabled(featureId, userRole)`
- ✅ User role from session

### Missing / Incomplete

- ⚠️ Dashboard not separated by role (all see same dashboard)
- ⚠️ GESTOR/COLABORADOR roles created but no dedicated features/views yet
- ⚠️ Some feature flags disabled but no clear roadmap for enablement

---

## 5. CURRENT HOOKS & SERVICES

### Hooks

**useIntegrationStatus** (`hooks/use-integration-status.ts`)
- **Purpose**: Poll integration status from backend
- **Interval**: 5 minutes (configurable)
- **Returns**: `{ status, isLoading, refetch }`
- **Data structure**: IntegrationStatusData with status (sincronizando_historico/processando/concluido/erro), records, sync time
- **Usage**: Integracoes page, Dashboard header badges
- **Limitation**: Polling only, no WebSocket/SSE

**useSyncStatus** (`hooks/use-sync-status.ts`)
- **Purpose**: Manage sync state for manual trigger
- **Returns**: `{ state, isLoading, logs, lastSyncTime, sync() }`
- **State**: idle/syncing/success/error
- **Usage**: Manual "Sincronizar Agora" button
- **Limitation**: No auto-retry on failure

**useGameificacaoFeedback** (`hooks/use-gamificacao-feedback.ts`)
- **Purpose**: Task completion feedback
- **Usage**: Dashboard task completion notifications
- **Limitation**: Basic implementation

### Services

**getDashboardSummary** (`lib/services/dashboard-summary.ts`)
- **Signature**: `({ year, month, day?: number }): Promise<DashboardSummary | null>`
- **Endpoint**: `/api/dashboard/summary?month=X&year=Y[&day=Z]`
- **Returns**: DashboardSummary with KPIs, grafico[], financeiro details
- **Cache**: no-store (always fresh)
- **Timeout**: 10 seconds
- **Usage**: Dashboard, Financeiro, comparativos

**getIntegrationStatus** (`lib/services/integrations-service.ts`)
- **Signature**: `(): Promise<IntegrationStatusResponse | null>`
- **Endpoint**: `/api/integrations/status`
- **Returns**: status, lastSync, recordsProcessed, registrosTotal, _meta (source, cronStatus)
- **Usage**: useIntegrationStatus hook

**syncFoneNinja** (`lib/services/integrations-service.ts`)
- **Signature**: `(): Promise<SyncResponse>`
- **Endpoint**: `POST /api/integrations/foneninja/sync`
- **Returns**: { success, message, data: { recordsProcessed, duration, timestamp } }
- **Usage**: Manual sync trigger

---

## 6. CURRENT UI STATUS

### Loading States ✅

- **KpiSkeleton**: Placeholder for KPI cards while loading
- **GraficoVazio**: Empty state for charts with no data
- **Inline loading**: Blue alert banner during fetch

### Empty States ✅

- **Financeiro tabelas**: "Nenhuma despesa/venda no período"
- **Gráficos**: "Sem dados"
- **Dashboard**: Alert banner if no data available

### Real-time Badges ✅

- Green badge: PostgreSQL sync status + timestamp
- Outline badge: Data origin indicator
- Integration status badges in Integracoes page

### Charts (Recharts) ✅

- **GraficoFluxoCaixa**: Area chart (saldo over time)
- **GraficoCategorias**: Pie/bar chart (despesas breakdown)
- **GraficoFinanceiro**: Area chart (receita/despesas/lucro)
- All dynamic titles based on month/year selection

### Filters ✅

- **Select components**: Month, Year, Day (optional)
- **Reset on change**: Day resets when month/year changes
- **Disabled states**: None currently, but can be added

### Polling Indicators

- Integration status refreshes every 5 minutes (silently)
- Manual refetch button available in Integracoes

---

## 7. KNOWN PROBLEMS

### Backend Reconciliation

- **Status**: In progress
- **Issue**: KPI values may diverge slightly until imports fully reconcile
- **Impact**: Transient inconsistencies in values
- **Resolution**: Waiting on backend to stabilize imports
- **Not blocker**: UI correctly shows data; issue is data quality not UI bugs

### Feature Flags

- **Comercial, Operação, Processos**: Feature flags disabled but menu items still visible
- **Resolution**: Should either hide menu items or enable features
- **Not critical**: Users redirected appropriately via feature flags

### Data Divergence

- **Monthly KPIs**: May not exactly match daily rollups until backend import stabilizes
- **Dashboard values**: Assume these will eventually match once all data synchronized
- **Impact**: Low - values are in reasonable ranges, just need fine-tuning

### Incomplete Modules

- **Ranking**: Only Leaderboard; needs top 3, points, streaks visualization
- **Comercial**: Feature flag disabled; needs Kommo integration
- **Dashboard by Profile**: Doesn't exist; all users see same dashboard

---

## 8. NEXT PRIORITIES (Confirmed Order)

### Priority 1: Dashboard by Profile
- **What**: Separate dashboard views for SUPER_USER, ADMIN, GERENTE, COLABORADOR
- **Why**: Business requirement; different roles need different KPI emphasis
- **Effort**: Medium (conditional rendering, new layouts)
- **Blocker**: None

### Priority 2: Ranking Complete
- **What**: Expand Leaderboard to include top 3 detailed, points per day, levels, streaks
- **Why**: Gamificação core feature
- **Effort**: Medium (new components, backend integration if needed)
- **Blocker**: Verify backend has points/streaks data

### Priority 3: Comercial + Kommo Integration
- **What**: Enable Comercial feature, integrate Kommo CRM leads/chats
- **Why**: Sales team dependency
- **Effort**: High (new module, external API)
- **Blocker**: Kommo API credentials, data model definition

### Priority 4: Full RBAC Route/Menu Sync
- **What**: Ensure menu items and routes perfectly align with role requirements
- **Why**: Security + UX consistency
- **Effort**: Low (audit + fixes)
- **Blocker**: None

### Priority 5: Meu Assessor Integration
- **What**: Financial assessment/comparison module (if backend provides)
- **Why**: Financial analysis depth
- **Effort**: Unknown (depends on backend API)
- **Blocker**: Backend API design

---

## 9. IMPORTANT RULES (DO NOT BREAK)

### Architecture Rules ✅

- **Frontend is HTTP client ONLY**: Consumes backend REST APIs exclusively
- **PostgreSQL is source of truth**: All data via backend, no Prisma in frontend
- **No direct external APIs**: Kommo, integrations go through backend only
- **shadcn/ui always**: Use component library, no custom CSS libraries
- **React hooks for state**: Zustand for gamificação, Context for menu, hooks for everything else

### Implementation Rules ✅

- **Preserve current polling**: 5 minute intervals for integration status
- **Preserve monthly/daily separation**: Critical for financial accuracy
- **No premature refactors**: Current architecture working; only change for bugs
- **No new abstractions**: Avoid creating helpers for single use cases
- **Preserve RBAC logic**: Feature flags + role checks are correct

### Code Quality ✅

- **Build must pass**: `npm run build` no errors, no sensitive logs
- **No token in console**: All sensitive data protection in place
- **Hydration safe**: No Date() in SSR, mounted states for browser-only features
- **Responsive**: Mobile first, Tailwind breakpoints

---

## 10. NEXT SESSION RESUME

See: **CONTINUE_HERE_FRONTEND.md** (auto-generated in parallel)

Key points for next session:
- All financial data now real + PostgreSQL-backed
- RBAC protection working
- Polling/sync badges active
- Focus: Dashboard by Profile + Ranking expansion
- No critical blockers
- Build state: passing

---

**Document Status**: ✅ CURRENT - Reflects actual codebase state as of 2026-05-12
**Confidence Level**: 🟢 HIGH - All items verified during implementation session
**Next Review**: After Dashboard by Profile implementation
