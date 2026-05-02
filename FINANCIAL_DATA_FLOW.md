# Fluxo de Dados Financeiros - Documento de Correção

## 📊 Objetivo
Garantir que dados financeiros (receita, lucro, despesas, saldo) sejam carregados corretamente do backend e exibidos no Dashboard.

---

## 🔄 Fluxo Completo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                               │
└─────────────────────────────────────────────────────────────────────┘

Backend (localhost:3001)
    ↓
    GET /api/financeiro/snapshot?month=X&year=Y
    └─ Retorna: { receita, despesasFixas, despesasVariaveis, netProfit, ... }
    
    GET /api/dashboard
    └─ Retorna: { financeiro: {...}, comercial: {...}, ... }
    ↓
Frontend (lib/backend-financeiro.ts)
    ├─ getSnapshotFinanceiroServer(month, year, token)
    │  └─ Chama backendFetch com token
    │  └─ Extrai data?.data || data
    │  └─ Logs detalhados
    │
    └─ getDashboardDataServer(token)
       └─ Chama backendFetch com token
       └─ Extrai data?.data || data
       └─ Logs detalhados
    ↓
Dashboard Page (app/(dashboard)/page.tsx)
    ├─ Carrega snapshot + dashboardData em paralelo
    ├─ Extrai financeiroData de dashboardData?.financeiro
    │
    ├─ Mapeamento com Fallbacks:
    │  ├─ faturamentoMes:
    │  │  snapshot?.receita
    │  │  ?? snapshot?.totalReceitas
    │  │  ?? snapshot?.faturamento
    │  │  ?? dashboardData?.receita
    │  │  ?? financeiroData?.receita
    │  │  ?? 0
    │  │
    │  ├─ despesasFixas:
    │  │  snapshot?.fixedExpensesTotal
    │  │  ?? snapshot?.fixedExpenses
    │  │  ?? snapshot?.despesasFixas
    │  │  ?? dashboardData?.despesasFixas
    │  │  ?? financeiroData?.despesasFixas
    │  │  ?? 0
    │  │
    │  └─ lucroLiquidoMes:
    │     snapshot?.netProfit
    │     ?? snapshot?.lucroLiquido
    │     ?? dashboardData?.lucroLiquido
    │     ?? financeiroData?.lucroLiquido
    │     ?? 0
    │
    └─ Validação:
       └─ Se TODOS os valores forem 0 → Log de aviso
       └─ Se algum valor > 0 → OK
    ↓
DashboardAdmin Component (components/dashboard/dashboard-admin.tsx)
    ├─ Recebe props:
    │  ├─ faturamentoMes
    │  ├─ despesasMes
    │  ├─ lucroLiquidoMes
    │  └─ resumoHoje: { faturamentoDia, lucroBrutoDia, margemBrutaDia }
    │
    └─ Renderiza KPI Cards com valores formatados em BRL
```

---

## 🔧 O Que Foi Implementado

### 1. **Melhorias em backend-financeiro.ts**

#### getSnapshotFinanceiroServer()
```typescript
✅ Valida se token foi fornecido
✅ Verifica se resposta é OK (response.ok)
✅ Extrai data?.data || data
✅ Logs do resultado:
   - [getSnapshotFinanceiroServer] Snapshot carregado com sucesso
   - Mostra: month, year, hasData, fields (nomes de campos)
✅ Logs de erro se falhar
```

#### getDashboardDataServer()
```typescript
✅ Valida se token foi fornecido
✅ Verifica se resposta é OK
✅ Extrai data?.data || data
✅ Logs do resultado:
   - [getDashboardDataServer] Dashboard carregado com sucesso
   - Mostra: hasData, fields (nomes de campos)
✅ Logs de erro se falhar
```

### 2. **Melhorias em app/(dashboard)/page.tsx**

#### Mapeamento Robusto
```typescript
✅ 7 fallbacks para faturamentoMes:
   snapshot?.receita
   ?? snapshot?.totalReceitas
   ?? snapshot?.faturamento
   ?? dashboardData?.receita
   ?? dashboardData?.totalReceitas
   ?? financeiroData?.receita
   ?? 0

✅ 7 fallbacks para despesasFixas
✅ 8 fallbacks para lucroLiquidoMes
✅ 5 fallbacks para cada campo do resumoHoje
```

#### Logging Detalhado
```
[Dashboard] Iniciando carregamento: { month, year }
[Dashboard] Raw dashboardData (completo): JSON inteiro
[Dashboard] Raw snapshot (completo): JSON inteiro
[Dashboard] Dados extraídos financeiroData: extração
[Dashboard] Mapeamento de valores: quais campos foram encontrados
[Dashboard] Valores finais mapeados: valores após fallbacks
[Dashboard] ⚠️ TODOS VALORES ZERO: alerta se nenhum dado foi carregado
```

#### Validação Automática
```typescript
✅ Se TODOS os valores = 0, exibe aviso detalhado:
   - Quais endpoints devem retornar dados
   - Quais campos o backend deveria ter
```

---

## 🧪 Como Testar

### Teste 1: Verificar Token Válido
```bash
1. Abra DevTools → Console
2. Faça login como GESTOR ou ADMIN
3. Vá para o Dashboard
4. No console, procure:
   [Dashboard Auth Debug] {
     hasSession: true,
     hasUser: true,
     hasAccessToken: true,    # DEVE SER TRUE
     tokenLength: > 100,      # Deve ter comprimento válido
     userRole: "GESTOR"
   }
```

### Teste 2: Verificar Carregamento de Dados
```bash
1. No console, procure:
   
   [getSnapshotFinanceiroServer] Snapshot carregado:
   {
     month: 5,
     year: 2026,
     hasData: true,           # DEVE SER TRUE se backend respondeu
     fields: ["receita", "despesasFixas", ...]  # Nomes dos campos
   }
   
   [getDashboardDataServer] Dashboard carregado:
   {
     hasData: true,
     fields: ["financeiro", "comercial", ...]
   }
```

### Teste 3: Verificar Mapeamento de Valores
```bash
1. No console, procure:
   
   [Dashboard] Raw dashboardData (completo):
   (mostra JSON inteiro do dashboard)
   
   [Dashboard] Raw snapshot (completo):
   (mostra JSON inteiro do snapshot)
   
   [Dashboard] Mapeamento de valores:
   {
     "snapshot.receita": 50000,      # Mostra qual campo foi encontrado
     "snapshot.totalReceitas": null,
     ...
   }
   
   [Dashboard] Valores finais mapeados:
   {
     faturamentoMes: 50000,    # VALOR FINAL APÓS FALLBACKS
     despesasFixas: 15000,
     despesasVariaveis: 5000,
     despesasMes: 20000,
     lucroLiquidoMes: 30000,
     resumoHoje: {
       faturamentoDia: 2500,
       lucroBrutoDia: 1000,
       margemBrutaDia: 40.5
     }
   }
```

### Teste 4: Verificar Dashboard Renderizado
```bash
1. Se valores aparecerem no dashboard (não "—"), OK ✅
2. Se valores forem "—" ou "0", procure no console:
   
   [Dashboard] ⚠️ TODOS OS VALORES FINANCEIROS ESTÃO ZERO
   [Dashboard] Verifique os endpoints:
   {
     "/api/financeiro/snapshot": "deveria retornar dados financeiros",
     "/api/dashboard": "deveria retornar dados agregados",
     "Campos esperados": ["receita", "totalReceitas", ...]
   }
```

---

## 📋 Valores Esperados vs Encontrados

### Se Dashboard Mostra Valores ✅
```
Faturamento do Dia:   R$ 2.500,00
Faturamento do Mês:   R$ 50.000,00
Lucro Bruto:          R$ 1.000,00 (40.5%)
Lucro Líquido:        R$ 30.000,00
Total Despesas:       R$ 20.000,00
```

### Se Dashboard Mostra "—" ou "0" ❌
```
Significa: Backend não retornou nenhum dos campos esperados

Solução:
1. Verifique se /api/financeiro/snapshot está respondendo
2. Verifique se /api/dashboard está respondendo
3. Verifique quais campos o backend retorna (veja os logs)
4. Atualize o mapeamento com os nomes corretos dos campos
```

---

## 📊 Campos Suportados (Mapeamento)

| Campo Esperado | Alternativas no Backend |
|---|---|
| receita | totalReceitas, faturamento |
| despesasFixas | fixedExpensesTotal, fixedExpenses, despesas_fixas |
| despesasVariaveis | variableExpenses, despesas_variaveis |
| lucroLiquido | netProfit, lucro_liquido |
| receitaHoje | todayRevenue, receita_hoje |
| lucroBrutoDia | todayProfit, lucro_bruto_hoje |
| margemBrutaDia | todayMargin, margem_bruta_hoje |

---

## 🔍 Troubleshooting

| Problema | Log para Procurar | Solução |
|---|---|---|
| Valores zerados | `[Dashboard] ⚠️ TODOS OS VALORES ZERO` | Backend não retornando dados |
| Token inválido | `hasAccessToken: false` | Faça login novamente |
| Erro de resposta | `[getSnapshotFinanceiroServer] Resposta não OK` | Status HTTP do backend |
| Dados não aparecem | `hasData: false` | Verifique endpoint `/api/dashboard` |
| Mapeamento errado | `[Dashboard] Mapeamento de valores` | Atualize o mapeamento com nomes corretos |

---

## 🎯 Menu do SuperUser - Integração

### Dados Carregados pelo Dashboard
```
MenuConfigProvider (layout.tsx)
    ↓
    Carrega: GET /api/dev-menu
    ↓
    Distribui via Context
    ↓
    AppSidebar filtra itens com base em roles
    ↓
    Cada usuário vê apenas itens permitidos
```

### Fluxo SuperUser Edit
```
DeveloperMenuEnhanced
    ├─ Carrega menu items do Context
    ├─ SuperUser altera visibilidade/roles
    ├─ Clica "Salvar Alterações"
    ├─ PUT /api/dev-menu/{itemId}
    └─ localStorage atualizado
```

---

## 📝 Checklist de Validação

- [ ] Token válido no console (hasAccessToken: true)
- [ ] Snapshot carregado (hasData: true)
- [ ] Dashboard carregado (hasData: true)
- [ ] Pelo menos 1 valor > 0 no dashboard
- [ ] Todos os valores aparecem formatados em BRL
- [ ] Se zeros, alerta detalhado no console
- [ ] Menu do SuperUser carrega itens
- [ ] SuperUser pode alterar visibilidade
- [ ] Alterações persistem em localStorage
- [ ] Navbar atualiza após salvar menu

