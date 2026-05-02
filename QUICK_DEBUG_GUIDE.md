# Guia Rápido de Debugging

## 🚀 Start Here - Checklist Rápido

### Passo 1: Verificar Autenticação
```
F12 → Console → procure por:
[Dashboard Auth Debug] {
  hasAccessToken: true    ← DEVE SER TRUE
  tokenLength: > 100
  userRole: "GESTOR"
}

Se FALSE:
  → Faça login novamente
  → Verifique se backend está rodando
```

### Passo 2: Verificar Carregamento de Dados Financeiros
```
Console → procure por:
[getSnapshotFinanceiroServer] Snapshot carregado com sucesso: {
  month: 5,
  year: 2026,
  hasData: true,          ← DEVE SER TRUE
  fields: [...]
}

Se false:
  → Backend /api/financeiro/snapshot não respondeu
  → Verifique: http://localhost:3001/api/financeiro/snapshot
```

### Passo 3: Verificar Valores no Dashboard
```
Console → procure por:
[Dashboard] Valores finais mapeados: {
  faturamentoMes: 50000,   ← SE 0, ver próximo passo
  despesasFixas: 15000,
  despesasVariaveis: 5000,
  lucroLiquidoMes: 30000
}

Se TODOS ZEROS:
  → [Dashboard] ⚠️ TODOS OS VALORES FINANCEIROS ESTÃO ZERO
  → Verifique quais campos backend está retornando
```

### Passo 4: Verificar Menu do SuperUser
```
Logue como SUPER_USER:
  → Sidebar deve mostrar "Developer Dashboard" em "Desenvolvedor"
  
Se não aparecer:
  → Você não é SUPER_USER ou admin@guimicell.com
  → Verifique role no banco de dados

No /super-usuario, procure por:
[MenuConfigProvider] Items carregados do localStorage: {
  count: 10,              ← Deve ter items
  items: [...]
}

Se 0 items:
  → [MenuConfigProvider] Nenhum menu config carregado
  → Backend /api/dev-menu não respondeu
```

---

## 🔴 Problema: Dashboard Mostra Zeros

### Debug Sequence:

#### 1. Verificar Token
```
Console:
[Dashboard Auth Debug]
  hasAccessToken: true ?     → SIM: passar para #2
                              → NÃO: faça login novamente
```

#### 2. Verificar Snapshot
```
Console:
[getSnapshotFinanceiroServer] Snapshot carregado: hasData: true ?
  → SIM: passar para #3
  → NÃO: procure por erro:
     [getSnapshotFinanceiroServer] Resposta não OK: {status: 401, 403, 500}
     → Pode estar relacionado a token ou permissão
```

#### 3. Verificar Nomes de Campos
```
Console:
[Dashboard] Mapeamento de valores:
  "snapshot.receita": ???         ← Veja qual campo tem valor
  "snapshot.totalReceitas": null
  "snapshot.faturamento": null
  "dashboardData.receita": null
  "financeiroData.receita": null

Exemplo:
  Se "snapshot.receita": null mas "snapshot.sales": 50000
  → Backend usa "sales" ao invés de "receita"
  → Atualize o mapeamento no page.tsx
```

#### 4. Verificar JSON Completo
```
Console:
[Dashboard] Raw snapshot (completo):
  (clique para expandir no console)
  
Procure por campos com valores:
  - receita, revenue, faturamento, totalReceitas, sales
  - despesasFixas, fixedExpenses, despesas_fixas
  - lucroLiquido, netProfit, lucro_liquido
  
Anotar os nomes corretos usados pelo seu backend
```

#### 5. Atualizar Mapeamento
```
Se descobriu que backend usa "sales" ao invés de "receita":

Edite: app/(dashboard)/page.tsx

const faturamentoMes =
  snapshot?.receita ??
  snapshot?.sales ??     ← ADICIONE AQUI
  snapshot?.totalReceitas ??
  ...
```

---

## 🔴 Problema: Menu do SuperUser Não Carrega

### Debug Sequence:

#### 1. Verificar Acesso
```
Você é SUPER_USER ou admin@guimicell.com ?
  → NÃO: você não tem acesso
  → SIM: passar para #2
```

#### 2. Verificar Carregamento do Menu Config
```
Console:
[MenuConfigProvider] Items carregados do localStorage: {
  count: 10
}

Se count: 0 ou não aparecer:
  → Procure por: [MenuConfigProvider] Usando initialItems do props
  → Se não aparecer nada: backend não respondeu
```

#### 3. Verificar Backend /api/dev-menu
```
Console:
[backendFetch] Token validado e aplicado: {
  path: "/api/dev-menu"   ← Se não aparecer, token inválido
}

Se não aparecer:
  → Token é inválido ou não fornecido
  → Faça login novamente

Se aparecer:
  → Verifique se backend respondeu com dados
  → Abra DevTools → Network → procure por /api/dev-menu
  → Status deve ser 200 OK
  → Response deve ter array de items
```

#### 4. Verificar Renderização do Componente
```
Console:
[AppSidebar] Menu config carregado: {
  count: 10,
  items: [...]
}

Se não aparecer:
  → AppSidebar não recebeu menuConfigItems do Context
  → Verifique se MenuConfigProvider está wrappando o layout
```

---

## 🔴 Problema: Alterações de Menu Não Salvam

### Debug Sequence:

#### 1. Verificar Update Item
```
Console:
[MenuConfigProvider] Item atualizado: {
  id: "financeiro",
  changes: {...},
  newState: {...}
}

Se não aparecer:
  → updateItem não foi chamado
  → Verifique se você clicou em "Salvar Alterações"
```

#### 2. Verificar Resposta da API
```
DevTools → Network → procure por PUT /api/dev-menu/{itemId}
  → Status 200 OK: sucesso ✅
  → Status 400: erro de validação
  → Status 401: token inválido
  → Status 500: erro no backend

Se erro:
  Response mostrará detalhes do problema
```

#### 3. Verificar localStorage
```
DevTools → Application → Local Storage → procure por "dev-menu-config"
  
Se vazio:
  [MenuConfigProvider] Erro ao salvar no localStorage
  → localStorage pode estar cheio ou desativado

Se tem dados:
  Alterações foram salvas localmente ✅
```

#### 4. Verificar Propagação no Navbar
```
Console:
[AppSidebar] Filtragem completa: {
  totalBefore: 10,
  totalAfter: 8,      ← Se mudou, filtragem funcionou
  groups: [...]
}

Se totalBefore = totalAfter:
  → Item não foi realmente filtrado
  → Verifique a lógica de filtragem
```

---

## 🔴 Problema: Navbar Não Atualiza Após Salvar Menu

### Debug Sequence:

#### 1. Verificar localStorage
```
DevTools → Application → Storage → Local Storage

Procure por "dev-menu-config"
  → Dados devem estar atualizados após salvar
```

#### 2. Fazer Refresh
```
F5 para recarregar a página

Se menu items aparecerem/desaparecerem após refresh:
  → Problema: Context não está atualizando em real-time
  → Solução: Refresh funciona, update em real-time ainda tem bug
```

#### 3. Verificar Context Update
```
Console → procure por sequência:

[MenuConfigProvider] Item atualizado: {...}
[MenuConfigProvider] Alterações salvas no localStorage: {...}
[AppSidebar] Filtragem completa: {...}   ← Deve vir logo depois

Se [AppSidebar] não aparece:
  → Context update não propagou para AppSidebar
  → Pode ser problema de dependency array
```

---

## 📋 Console Logs Esperados

### Ao Entrar no Dashboard (GESTOR)
```
[Dashboard Auth Debug] { hasAccessToken: true, ... }
[backendFetch] Token validado e aplicado: { path: "/api/tasks", ... }
[getSnapshotFinanceiroServer] Snapshot carregado: { hasData: true, ... }
[getDashboardDataServer] Dashboard carregado: { hasData: true, ... }
[Dashboard] Raw dashboardData: {...}
[Dashboard] Raw snapshot: {...}
[Dashboard] Valores finais mapeados: { faturamentoMes: XXX, ... }
[AppSidebar] Menu config carregado: { count: XX, ... }
[AppSidebar] Filtragem completa: { totalBefore: XX, totalAfter: XX, ... }
```

### Ao Entrar em /super-usuario (SUPER_USER)
```
[backendFetch] Token validado e aplicado: { path: "/api/dev-menu", ... }
[MenuConfigProvider] Items carregados do localStorage: { count: XX, ... }
  OU
[MenuConfigProvider] Usando initialItems do props: { count: XX, ... }
[AppSidebar] Menu config carregado: { count: XX, ... }
[DeveloperMenuEnhanced] Componente renderizado
```

### Ao Salvar Alterações
```
[MenuConfigProvider] Item atualizado: { id: "financeiro", ... }
[MenuConfigProvider] Alterações salvas no localStorage: { ... }
(no Network tab: PUT /api/dev-menu/financeiro → 200 OK)
Toast "Alterações salvas com sucesso!"
[AppSidebar] Filtragem completa: { ... }  ← navbar atualiza
```

---

## 🎯 Checklist para Validar Tudo

```
Dados Financeiros:
  ☐ Dashboard mostra valores > 0
  ☐ Console mostra [Dashboard] Valores finais mapeados
  ☐ Token é válido ([Dashboard Auth Debug] hasAccessToken: true)
  ☐ Snapshot carregado ([getSnapshotFinanceiroServer] hasData: true)

Menu do SuperUser:
  ☐ Você é SUPER_USER ou admin@guimicell.com
  ☐ Developer Dashboard aparece na sidebar
  ☐ /super-usuario carrega lista de items
  ☐ Items têm estado (Ativo/Em Breve/Oculto)
  ☐ Pode clicar em checkboxes de roles
  ☐ Clique "Salvar Alterações" salva (PUT /api/dev-menu/{id})
  ☐ localStorage atualizado (dev-menu-config)
  ☐ F5 refresh mantém alterações

Filtragem Dinâmica:
  ☐ SuperUser restringe "Financeiro" para ADMIN
  ☐ COLABORADOR faz login - "Financeiro" não aparece
  ☐ ADMIN faz login - "Financeiro" aparece
  ☐ Console mostra [AppSidebar] {featureId} filtrado: role {role}

Propagação:
  ☐ Alterações de menu refletem sem F5 (ou após F5)
  ☐ Diferentes usuários veem menus diferentes
  ☐ localStorage não vira inconsistente com backend
```

---

## 🔗 Recursos

📄 **Documentos Detalhados:**
- `FINANCIAL_DATA_FLOW.md` - Fluxo completo de dados financeiros
- `SUPERUSER_MENU_FIX.md` - Menu do SuperUser em detalhes
- `IMPLEMENTATION_SUMMARY.md` - Resumo técnico
- `TEST_CHECKLIST.md` - Checklist completo de testes

🔍 **Como Abrir DevTools:**
- Windows/Linux: F12
- Mac: Cmd + Option + I

📍 **Endpoints Importantes:**
- Financeiro: `http://localhost:3001/api/financeiro/snapshot?month=5&year=2026`
- Dashboard: `http://localhost:3001/api/dashboard`
- Menu: `http://localhost:3001/api/dev-menu`

