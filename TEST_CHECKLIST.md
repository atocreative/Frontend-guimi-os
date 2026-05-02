# Checklist de Testes - Frontend GuimiCell OS

## 1. Validação de Token e Autenticação

### Backend API Token Validation
- [x] `getSessionAccessToken()` valida se o token é string não-vazia
- [x] `backendFetch()` valida formato JWT (3 partes separadas por ponto)
- [x] Erro lançado se token inválido é fornecido
- [x] Console logs detalhados para debug de token

### Client-Side Token Management
- [x] `getAuthToken()` valida token em cache antes de usar
- [x] Token em cache inválido é limpo automaticamente
- [x] Novo token obtido é validado antes de ser armazenado
- [x] Validação inclui: não-vazio + 3 partes JWT

**Como testar:**
1. Abra DevTools → Console
2. Faça login e navegue para o Dashboard
3. Verifique logs `[backendFetch]` e `[getAuthToken]` mostrando validação
4. Tente fazer requisições - o console deve mostrar token info detalhada

---

## 2. Dashboard - Dados Financeiros

### Verificação de Dados
- [x] `export const dynamic = "force-dynamic"` desativa cache
- [x] Console logs mostram `Raw dashboardData` completo
- [x] Console logs mostram `Raw snapshot` completo
- [x] Console logs mostram `financeiroData` extraído
- [x] Console logs mostram `Mapped values` dos campos financeiros

### Campos Mapeados
```
faturamentoMes = snapshot?.receita || financeiroData?.receita || 0
despesasFixas = snapshot?.fixedExpensesTotal || financeiroData?.despesasFixas || 0
despesasVariaveis = snapshot?.despesasVariaveis || financeiroData?.despesasVariaveis || 0
lucroLiquidoMes = snapshot?.netProfit || financeiroData?.lucroLiquido || 0
```

**Como testar:**
1. Faça login como GESTOR ou ADMIN
2. Vá para Dashboard
3. Abra DevTools → Console
4. Verifique os logs:
   - `[Dashboard] Raw dashboardData:` (deve mostrar JSON completo)
   - `[Dashboard] Raw snapshot:` (deve mostrar JSON completo)
   - `[Dashboard] Mapped values:` (deve mostrar valores numéricos)
5. Verifique se os valores no dashboard correspondem aos logs
6. **IMPORTANTE:** Se valores forem 0, verifique os logs para identificar qual campo backend está retornando

### Possíveis Problemas
```
Se faturamentoMes = 0:
  ├─ Snapshot não tem 'receita'
  └─ financeiroData não tem 'receita'
  
Se despesasFixas = 0:
  ├─ Snapshot não tem 'fixedExpensesTotal'
  └─ financeiroData não tem 'despesasFixas'
  
Se lucroLiquidoMes = 0:
  ├─ Snapshot não tem 'netProfit'
  └─ financeiroData não tem 'lucroLiquido'
```

---

## 3. Developer Dashboard - Menu do SuperUser

### Funcionalidade de Menu
- [x] Apenas SUPER_USER e admin@guimicell.com podem acessar `/super-usuario`
- [x] Menu config é carregado do backend via `/api/dev-menu`
- [x] Cada item de menu tem:
  - `id` (identificador único)
  - `name` (nome legível)
  - `enabled` (boolean)
  - `pending` (boolean - para "em breve")
  - `allowedRoles` (array de roles)
  - `description` (opcional)

### Estados do Menu Item
```
enabled=true, pending=false   → Ativo (verde)
enabled=true, pending=true    → Em Breve (amarelo/secundário)
enabled=false, pending=false  → Oculto (vermelho)
```

### Roles Suportados
- `COLABORADOR`
- `GESTOR`
- `ADMIN`
- `SUPER_USER`

**Como testar:**

#### 3.1 Acesso ao Developer Dashboard
1. Faça login como SUPER_USER ou com email admin@guimicell.com
2. Na sidebar, deve aparecer "Developer Dashboard" em "Desenvolvedor"
3. Clique e vai para `/super-usuario`
4. Se vir "Nenhum item de menu disponível", verifique:
   - Backend está rodando em http://localhost:3001
   - Endpoint `/api/dev-menu` está respondendo
   - Console mostra erro ao carregar menu

#### 3.2 Editar Visibilidade de Menu
1. No Developer Dashboard, encontre um item de menu
2. Clique no Select "Estado" e mude para:
   - "Ocultar" (esconde do navbar)
   - "Em breve" (mostra desativado)
   - "Ativo" (mostra ativo)
3. O card deve ficar com border azul (ALTERADO)
4. Clique "Salvar Alterações"
5. Deve aparecer toast "Alterações salvas com sucesso!"

#### 3.3 Editar Roles Permitidos
1. No Developer Dashboard, encontre um item de menu
2. Na seção "Visível para roles:", escolha quais roles podem acessar
3. Apenas roles selecionados devem ver o item
4. Clique "Salvar Alterações"
5. Verifique que a navbar se atualiza dinamicamente

#### 3.4 Persistência em localStorage
1. Abra DevTools → Application/Storage → Local Storage
2. Procure por chave `dev-menu-config`
3. Deve conter JSON com menu items configurados
4. Atualize a página (F5)
5. Configurações devem persistir

#### 3.5 Testar Filtro Dinâmico de Navbar
1. Como SUPER_USER, configure um menu item para `allowedRoles: ["ADMIN"]` somente
2. Deslogue e logue como COLABORADOR
3. Aquele menu item **não deve aparecer** na sidebar
4. Logue novamente como ADMIN
5. Aquele menu item **deve aparecer**

### Console Logs para Debug
```javascript
// No console do Developer Dashboard:
// Você verá logs de:
// ├─ Carregamento: [menuconfigprovider] Items carregados
// ├─ Atualização: [menuconfigprovider] Item atualizado
// ├─ Salvamento: [menuconfigprovider] Alterações salvas
// └─ Erro: [menuconfigprovider] Erro ao salvar

// No console do Dashboard/Navbar:
// Você verá:
// ├─ [AppSidebar] Menu config carregado
// ├─ [AppSidebar] Filtrando items com roles
// └─ [AppSidebar] {N} items após filtro
```

---

## 4. Testes de Integração

### Fluxo Completo: SUPER_USER Altera Menu
```
1. SUPER_USER loga e vai para /super-usuario
2. Encontra "Financeiro" (id: financeiro)
3. Muda allowedRoles para ["ADMIN"] somente
4. Clica "Salvar Alterações"
5. Desloga
6. COLABORADOR loga
7. Verifica que "Financeiro" não aparece na sidebar
8. ADMIN loga
9. Verifica que "Financeiro" aparece normalmente
```

### Fluxo Completo: Token Inválido
```
1. Abra DevTools → Storage → Cookies
2. Modifique o session cookie para conteúdo inválido
3. Tente fazer qualquer ação que requer auth
4. Console deve mostrar erro de token
5. Sistema deve redirecionar para login
6. Modal de expiração deve aparecer (se configurado)
```

---

## 5. Checklist Final

- [ ] Dashboard mostra valores financeiros corretos (não zeros)
- [ ] Console logs mostram mapeamento correto de campos
- [ ] Developer Dashboard carrega menu corretamente
- [ ] SuperUser pode alterar visibilidade
- [ ] Alterações são persistidas em localStorage
- [ ] Navbar se atualiza dinamicamente após salvar
- [ ] Token é validado antes de requisições
- [ ] Erros de token mostram mensagens claras
- [ ] Deslogue/logue - configurações de menu persistem
- [ ] Diferentes roles veem menus diferentes

---

## 6. URLs de Teste

```bash
# Local Development
http://localhost:3000/login                    # Login page
http://localhost:3000/                         # Dashboard (admin/gestor)
http://localhost:3000/super-usuario            # Developer Dashboard (super_user apenas)

# Backend Endpoints (deve estar rodando em localhost:3001)
GET  /api/dev-menu                            # Carrega menu config
PUT  /api/dev-menu/{itemId}                  # Atualiza item
GET  /api/auth/token                          # Refresh token
GET  /api/tasks                                # Tarefas
GET  /api/dashboard                            # Dashboard data
```

---

## 7. Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Token inválido (vazio)" | Token vazio na sessão | Faça login novamente |
| "Formato de token inválido" | Token não é JWT válido | Verifique session no backend |
| "Nenhum item de menu disponível" | Backend /api/dev-menu não respondeu | Verifique se backend está rodando |
| Dashboard com zeros | Campos do backend têm nomes diferentes | Verifique console logs de mapeamento |
| Navbar não muda após salvar menu | localStorage não atualizado | Refresh F5 ou verifique DevTools |
| "Sessão expirada" | Token expirou | Faça login novamente ou espere retry automático |

