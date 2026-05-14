---
created: 2026-05-14 
version: v5.0 DIAGNÓSTICO RÁPIDO
status: CRÍTICO — 9 PROBLEMAS MAPEADOS
time: 10 minutos (máximo)
---

# REAL_STATUS_2026_05_14.md — DIAGNÓSTICO CRÍTICO

## ⚠️ RESUMO EXECUTIVO

**BUILD**: ✅ PASSA
**RUNTIME**: ❌ QUEBRA EM PRODUÇÃO
**MOCK**: 🔴 SILENCIOSO (sem aviso visual)
**LOCALHOST**: 🔴 HARDCODED (Railway vai quebrar)
**ENTREGA**: 🔴 NÃO PRONTO HOJE

---

## 9 PROBLEMAS CRÍTICOS (MAPEADOS)

### 1. ❌ LOCALHOST HARDCODED — RAILWAY VAI QUEBRAR

**Arquivos afetados**:
```
app/(auth)/login/page.tsx:25                    — captcha endpoint
app/(dashboard)/financeiro/page.tsx:10          — financeiro summary
app/(dashboard)/configuracoes/page.tsx          — usuario API
app/api/comercial/vendas/route.ts               — leads
app/api/dashboard/summary/route.ts              — summary
app/api/dev-menu/route.ts                       — dev menu
app/api/financeiro/*.ts (3 files)               — financeiro APIs
app/api/operacao/*.ts (2 files)                 — operacao APIs
components/super-usuario/*.tsx (2 files)        — error messages
lib/backend-api.ts:4                            — default fallback
lib/backend-financeiro.ts                       — default fallback
```

**Padrão encontrado**:
```typescript
process.env.NEXT_PUBLIC_API_BASE_URL || 
process.env.NEXT_PUBLIC_API_URL || 
"http://localhost:3001"  // ❌ HARDCODED
```

**Impact**: Em Railway, sem env var, vai falhar TODOS os endpoints.

**Fix**: Consolidar para UMA variável + falha explícita se não houver env.

---

### 2. 🔴 MOCK SILENCIOSO — FAKE DATA SEM AVISO

**Comercial**:
- `app/(dashboard)/comercial/page.tsx:39` → `leads || mockLeads`
- Se API falhar, mostra fake data com badge "Sincronizado com Kommo" (mentira)
- User não sabe que está vendo mock

**Dashboard**:
- `app/(dashboard)/data/mock.ts` → 30+ variáveis mock (financeiro, comercial, tarefas, etc)
- Importados em vários componentes mas nem sempre usados

**Configurações**:
- `app/(dashboard)/configuracoes/page.tsx` → Usa mockIntegracoes, mockSistema

**Fix**: Remover mock fallback OU mostrar estado "Dados indisponíveis" explicitamente.

---

### 3. ❌ INCONSISTENTE ENV VAR NAMING

**3 nomes diferentes usados**:
- `NEXT_PUBLIC_API_BASE_URL` — em lib/backend-api.ts, varios API routes
- `NEXT_PUBLIC_API_URL` — em financeiro, operacao
- `NEXT_PUBLIC_BACKEND_URL` — em login.page.tsx, configuracoes

**Result**: Confuso qual usar. Diferentes fallbacks. Fácil errar.

**Fix**: Usar ONE canônico: `NEXT_PUBLIC_API_BASE_URL`

---

### 4. ❌ LOGIN COM CAPTCHA (Funcionando mas frágil)

**Fluxo**:
1. Page monta → fetchCaptchaChallenge() (linha 51)
2. Se falhar → setError("Erro no anti-robô")
3. Recarrega a cada 60s (linha 56)

**Status**: Funcionando se backend `/api/auth/captcha` respondendo.

**Issue**: Se captcha endpoint cair, não consegue fazer login (sem fallback).

**Fix**: Validar se captcha endpoint está online no backend.

---

### 5. ❌ FILTROS FINANCEIROS PODEM ESTAR ERRADOS

**Arquivo**: `app/(dashboard)/financeiro/page.tsx:46-60`

**Problema**:
- Usa `Date.UTC()` para calcular startDate e endDate
- Backend pode estar em timezone diferente (BRT -3)
- "Faturamento do dia" pode estar incluindo dia errado

**Exemplo**: 
- Hoje: 2026-05-14 às 10:00 BRT
- Frontend calcula: 2026-05-01 00:00 UTC até 2026-06-01 00:00 UTC
- Backend recebe mas está em UTC
- Resultado: Dados podem estar desalinhados

**Fix**: 
1. Validar timezone do backend
2. Converter datas para "dias completos" em timezone local
3. Testar: hoje deve mostrar HOJE até agora, não até 23:59

---

### 6. ❌ KOMMO NÃO APARECE (ou mock)

**Status**: 
- Badge diz "Sincronizado com Kommo" (hardcoded, não dinâmico)
- Leads vêm de `getComercialLeads()` (backend)
- Se falhar → mockLeads (silencioso)

**Issue**: 
- Sem indicação visual se sincronizado de verdade
- Sem fallback para erro (mostra mock)

**Fix**: 
1. Adicionar loading/sync status real
2. Mostrar erro explícito se fetch falhar (não mock)

---

### 7. ❌ CLIENT/SERVER BOUNDARY ISSUES

**Já corrigido**:
- ✅ `lib/services/comercial-service.ts` — Removed `'use client'`

**Pendente**:
- ? Verificar se há mais "use client" indevido em server components
- ? Verificar se há mais server functions sendo chamadas de client

**Status**: Provavelmente OK (fix anterior resolveu comercial).

---

### 8. ❌ PERFORMANCE WARNINGS

**Encontrados**:
- Image with fill missing sizes (logo, backgrounds)
- LCP warnings (images loading late)
- Script tags inside components (possível)

**Fix**: 
1. Adicionar `sizes` em Next/Image
2. `loading="eager"` para hero images
3. Remover script tags do JSX

---

### 9. ❌ DEV-MENU INCOMPLETO

**Status**: Backend não persiste mudanças.

**Issue**: 
- Frontend permite toggle de features
- Mas mudança não salva no backend
- Na próxima page refresh, volta ao estado anterior

**Fix**: Desabilitar UI ou implementar backend (fora do escopo de hoje?).

---

## VALIDAÇÃO RÁPIDA (Antes de deploy)

```
[ ] 1. npm run build — 0 erros TypeScript
[ ] 2. Variável NEXT_PUBLIC_API_BASE_URL definida em .env.production
[ ] 3. Login funciona (captcha servidor respondendo)
[ ] 4. Comercial carrega leads reais (não mock)
[ ] 5. Financeiro mostra dia/mês corretos
[ ] 6. Nenhuma URL "localhost" em produção
[ ] 7. Sem console errors em browser
[ ] 8. Deploy em Railway sem falhas
```

---

## EXECUÇÃO HOJE

### PRIORIDADE 1 (Crítico):
1. ✅ Consolidar env var para `NEXT_PUBLIC_API_BASE_URL`
2. ✅ Remover localhost hardcode
3. ✅ Remover mock silent fallbacks (show error instead)

### PRIORIDADE 2 (Important):
4. Testar login/captcha
5. Validar filtros financeiros (timezone)
6. Testar Kommo fetch

### PRIORIDADE 3 (Nice-to-have):
7. Performance warnings
8. Client/server boundary
9. Dev-menu status

---

## STATUS REAL (Hoje 14-05-2026 ~10:15)

| Component | Status | Works? | Mock? | Localhost? |
|-----------|--------|--------|-------|-----------|
| Login | ⚠️ | SIM (se captcha ok) | NÃO | ❌ SIM |
| Comercial | ⚠️ | SIM | ❌ SIM (fallback) | ❌ SIM |
| Financeiro | ⚠️ | SIM | NÃO | ❌ SIM |
| Operacao | ✅ | SIM | NÃO | ❌ SIM |
| Agenda | ✅ | SIM | NÃO | ❌ SIM |
| RBAC | ✅ | SIM | NÃO | NÃO |
| Auth | ✅ | SIM | NÃO | NÃO |

**✅ = Pronto**
**⚠️ = Funciona mas com fallbacks ou localhost**
**❌ = Quebrado**

---

**Próximo passo**: Executar PRIORITY 1 (3 fixes rápidos).
**Tempo estimado**: 15-20 minutos para 3 fixes + validação.
**Depois**: PRIORITY 2 (testes manuais).
**Deadline**: Deploy pronto até 11:00 (amanhã cedo, entrega às 9:00).
