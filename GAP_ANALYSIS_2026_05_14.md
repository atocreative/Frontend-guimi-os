---
created: 2026-05-14 17:30
version: v1.0 DIAGNÓSTICO REAL COM PLAYWRIGHT
status: IN PROGRESS
mode: WAR ROOM - SEM FALSO POSITIVO
---

# GAP ANALYSIS — ESCOPO 2 vs REALIDADE (2026-05-14)

## 📊 SUMÁRIO EXECUTIVO

| Categoria | Status | Gravidade |
|-----------|--------|-----------|
| Build | ✅ Compila (mas com erros) | 🟠 AVISO |
| RBAC | ❌ Role "Developer" inválido | 🔴 CRÍTICO |
| Menu | ❌ Indicadores deve ser removido | 🟠 IMPORTANTE |
| Backend API | ❌ /integrations/status 404 | 🔴 CRÍTICO |
| Pages | ⚠️ Parcialmente funcionando | 🟠 IMPORTANTE |
| Dados | ✅ Reais (Financeiro OK) | ✅ OK |

---

## 🔴 GAPS CRÍTICOS (Bloqueantes)

### GAP #1: ROLE INVÁLIDA — "Developer" não mapeado

**Status**: ❌ BLOQUEANTE

**Encontrado**:
- User "admin@guimicell.com" tem role "Developer"
- Escopo 2 define: SUPER_USER, ADMIN, GERENTE, COLABORADOR
- Sistema tem: Developer (não no Escopo)

**Impacto**:
- RBAC não funciona conforme Escopo 2
- Dashboard Development pode ser acessado por Developer (não está em SUPER_USER only)
- Hierarquia de roles quebrada

**Correção Necessária**: 
- Mapear "Developer" → SUPER_USER OU
- Remover role "Developer" e usar SUPER_USER
- Validar migração de dados de todos os users

**Arquivo Afetado**: NextAuth configuration, /auth/[...nextauth].ts

---

### GAP #2: ENDPOINT NÃO EXISTE — `/integrations/status`

**Status**: ❌ BLOQUEANTE

**Encontrado**:
- Frontend chama GET `/integrations/status` na página de login
- Backend retorna: HTTP 404 Not Found (3 tentativas)
- Endpoint não implementado no backend

**Impacto**:
- Login mostra 3 console errors
- Status de integrações desconhecido
- Usuários veem erros no browser

**Correção Necessária**:
- Backend: Implementar GET `/api/integrations/status`
- Deve retornar: {fone_ninja, kommo, meu_assessor} com status {connected, disconnected, error}

**File Referência**: app/(auth)/login/page.tsx (faz fetch)

---

### GAP #3: INDICADORES NO MENU (deve ser REMOVIDO)

**Status**: ❌ NÃO CONFORMIDADE COM ESCOPO

**Encontrado**:
- Menu à esquerda mostra "Indicadores" em Gestão
- Escopo 2, seção 5.10: "A tela Indicadores será removida"
- Dados úteis devem ser redistribuídos em Dashboard, Financeiro, Comercial, Ranking

**Impacto**:
- Menu não respeita Escopo 2
- Usuários acessam página que deveria estar removida
- Confunde sobre estrutura final do sistema

**Correção Necessária**:
- Remover link "Indicadores" do menu
- Bloquear rota `/indicadores` (ou redirecionar)
- Validar se dados foram movidos para outras páginas

**File Afetado**: app/(dashboard)/layout.tsx (menu), app/(dashboard)/indicadores/page.tsx (rota)

---

## 🟠 GAPS IMPORTANTES (Não conformidade)

### GAP #4: BUILD COM ERROS (erro mascarado)

**Status**: ⚠️ IMPORTANTE

**Encontrado**:
```
✓ Compiled successfully in 21.4s ← Mentira!
[COMERCIAL LEADS] Fetch error: Dynamic server usage...
Erro ao buscar indicadores: Dynamic server usage...
```

**Issue**:
- Build diz "✓ Compiled" mas há 20+ erros durante compilação
- Indicadores usa `headers()` em route estático (Next.js error)
- Erro de: `app/(dashboard)/indicadores/page.tsx` usando `headers()` 

**Impacto**:
- Build passes CI/CD falso positivo
- Erros de runtime não aparecem até deploy
- Confiabilidade comprometida

**Correção Necessária**:
- Linha app/(dashboard)/indicadores/page.tsx: Remover `headers()` OU adicionar `'use dynamic'`
- Fazer build limpa (0 erros)

---

### GAP #5: MENU NÃO RESPEITA RBAC COMPLETO

**Status**: ⚠️ IMPORTANTE

**Encontrado**:
- User "Developer" vê TODAS as páginas do menu
- Menu mostra: Dashboard, Comercial, Financeiro, Operação, Processos, Colaboradores, **Indicadores**, Integrações, Configurações, Suporte, Dashboard Development
- Conforme Escopo 2: Comercial/Financeiro/Integrações devem ser restritos por role
- Dashboard Development: SUPER_USER only (Developer pode acessar?)

**Impacto**:
- Menu não está respeitando RBAC
- Usuários veem opções que não devem acessar
- Security issue: Acesso a endpoints não autorizado (mesmo se menu oculto, rota é acessível)

**Correção Necessária**:
- Implementar menu dinâmico com base em role
- Bloquear rotas não autorizadas (not just menu hiding)
- Validar no backend cada endpoint com RBAC

---

### GAP #6: KOMMO NÃO CONECTADO (ou fake)

**Status**: ⚠️ IMPORTANTE

**Encontrado**:
- Escopo 2: Kommo CRM deve fornecer dados de Comercial
- Status: "ainda não conectado" (conforme Escopo do PDF)
- Backend deve ter: /api/integrations/kommo/diagnostics, /api/integrations/kommo/sync

**Impacto**:
- Comercial page não tem dados reais do Kommo
- 250 leads prometidos no Escopo não estão vindindo
- Integração incompleta

**Correção Necessária**:
- Backend: Implementar Kommo CRM API
- Sincronizar leads, conversão, origem
- Adicionar status na página de Integrações

---

### GAP #7: SUPORTE E PROCESSOS NÃO HOMOLOGADOS

**Status**: ⚠️ IMPORTANTE

**Encontrado**:
- Menu mostra "Processos" (mas Escopo 2 diz: "Fora do escopo da nova versão. Pode ficar oculto ou "em breve"")
- Menu mostra "Suporte" (Escopo 2 implementa, parece OK)
- Não testei yet, mas "Processos" deve estar "em breve", não visível

**Impacto**:
- Menu não respeita status "em breve"
- Usuários clicam em feature que não está pronto

**Correção Necessária**:
- Esconder "Processos" ou marcar como "em breve"
- Testar conteúdo de Suporte contra Escopo 2

---

## ✅ O QUE FUNCIONA

### Pages Testadas

| Page | Status | Observações |
|------|--------|-------------|
| Login | ⚠️ Funciona (3 erros 404) | Endpoints /integrations/status faltam |
| Dashboard | ✅ Renderiza | Dados aparecem, menu funciona |
| Financeiro | ✅ Funciona | Dados reais do backend (R$307.656) |
| Comercial | ❓ Não testado | Deve ter dados do Kommo (falta integração) |
| Operação | ❓ Não testado | Deve ter estoque real |
| Ranking | ⚠️ Parcial | Gamificação indisponível |
| Agenda | ❓ Não testado | |
| Indicadores | ⚠️ Build error | Dynamic server error |
| Configurações | ❓ Não testado | |
| Suporte | ❓ Não testado | |

---

## 📋 PRÓXIMOS TESTES (Playwright)

```
[ ] Comercial — verificar dados Kommo vs mock
[ ] Operação — validar estoque real vs hardcoded
[ ] Ranking — validar gamificação
[ ] Agenda — CRUD de tarefas
[ ] Configurações — Integrações (Fone Ninja, Kommo, Meu Assessor)
[ ] Suporte — formulário funciona?
[ ] Indicadores — página carrega ou erro?
[ ] Dashboard Development — feature flags persistem?
[ ] RBAC — testar com COLABORADOR (precisa trocar usuário)
[ ] Responsividade — mobile OK?
```

---

## 📝 CONCLUSÃO PARCIAL

**Status Real (2026-05-14 17:30)**:
- ✅ Build compila (mas com warnings/erros mascarados)
- ❌ RBAC com role "Developer" não é Escopo 2
- ❌ Menu não remove "Indicadores" conforme Escopo
- ❌ Endpoint `/integrations/status` 404
- ✅ Dados financeiros carregam reais
- ⚠️ Kommo não conectado
- ⚠️ Múltiplas páginas não testadas yet

**Estimativa de Conformidade com Escopo 2**: ~40% (muito abaixo)

---

**Continuando diagnóstico com Playwright...**
