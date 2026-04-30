# Backend Integration Requirements - Frontend Updates

## Resumo
As alterações implementadas no frontend são principalmente locais e não requerem mudanças obrigatórias no backend. No entanto, existem **2 melhorias opcionais** recomendadas para completar a funcionalidade.

---

## ❌ Mudanças que NÃO requerem backend

### 1. Footer Duplication Fix
- **O que foi feito:** Removido Footer do `app/layout.tsx`, mantém apenas em `app/(dashboard)/layout.tsx`
- **Impacto no backend:** Nenhum
- **Status:** ✅ Completo

### 2. Integration Health Checks
- **O que foi feito:** Frontend agora faz requisições HTTP diretas para verificar status de APIs (Fone Ninja, Kommo, Meu Assessor)
- **Como funciona:** Usa `checkIntegrationHealth()` que faz fetch com timeout
- **Impacto no backend:** Nenhum (apenas verifica se endpoints respondem com status 200)
- **Status:** ✅ Completo

### 3. Feature Flags System (versão 1)
- **O que foi feito:** Sistema de feature flags em memória no frontend
- **Como funciona:** Arquivo `lib/feature-flags.ts` com objeto `FEATURE_FLAGS` definindo quais páginas estão ativas
- **Impacto no backend:** Nenhum (por enquanto - flags são em memória apenas)
- **Limitação:** Mudanças são resetadas ao recarregar a página
- **Status:** ✅ Completo, mas veja sugestão abaixo

### 4. Super User Dashboard (email-based)
- **O que foi feito:** Dashboard em `/super-usuario` acessível apenas via email `admin@aguimicell.com`
- **Como funciona:** Verifica `session.user.email === "admin@aguimicell.com"`
- **Impacto no backend:** O backend já retorna email na sessão - nenhuma mudança necessária
- **Status:** ✅ Completo

### 5. Real Data Integration
- **Financeiro page:** Usa `getFaturamentoMes()` e `getResumoFinanceiroHoje()` do Fone Ninja
- **Indicadores page:** Usa `getIndicadoresTime()` que chama `/api/users` do backend (endpoint já existe)
- **Impacto no backend:** `/api/users` já existe e está funcionando
- **Status:** ✅ Completo

---

## ⚠️ Mudanças obrigatórias (para frontend funcionar)

### Regenerar Prisma Client
**Arquivo afetado:** Backend - `backend-guimi-os`

**Problema:** Task service tenta usar campo `deletedAt` no Prisma, mas cliente não foi regenerado após schema update

**Solução:**
```bash
cd C:\Users\xgame\backend-guimi-os
npx prisma generate
npx prisma db push
```

**O que faz:** Recompila tipos Prisma com campo `deletedAt` do modelo Task

**Prioridade:** 🔴 CRÍTICA - Frontend não carregará sem isso

---

## 🟢 Mudanças opcionais recomendadas

### Opção 1: Persistência de Feature Flags (v2)
**Quando implementar:** Próximas sprints

**Objetivo:** Feature flags mudadas no Developer Dashboard persistem entre recarregamentos

**Endpoints necessários:**

#### GET `/api/feature-flags`
```typescript
// Retorna lista de todas as flags com estado persistido
Response {
  flags: [
    {
      id: "DASHBOARD",
      name: "Dashboard",
      enabled: true,
      requiredRole: null
    },
    {
      id: "COMERCIAL", 
      name: "Comercial",
      enabled: false,
      requiredRole: "ADMIN"
    },
    // ... mais flags
  ]
}
```

#### PATCH `/api/feature-flags/:flagId`
```typescript
// Requer autenticação como admin@aguimicell.com
Request {
  enabled: boolean
}

Response {
  success: boolean,
  flag: { id, name, enabled, requiredRole }
}
```

**Autenticação:** Apenas `admin@aguimicell.com` pode acessar

**Armazenamento:** Criar tabela `FeatureFlag` no Prisma:
```prisma
model FeatureFlag {
  id        String   @id @unique
  name      String
  description String?
  enabled   Boolean  @default(false)
  requiredRole String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Impacto no frontend:** 
- Remover hardcodes em `lib/feature-flags.ts`
- Buscar flags do endpoint `/api/feature-flags` ao carregar sessão
- Usar PATCH `/api/feature-flags/:flagId` no componente `FeatureFlagToggle`

---

### Opção 2: Super User Role (v2)
**Quando implementar:** Junto com persistência de feature flags

**Objetivo:** Criar role `SUPER_USER` no banco de dados para usuário especial

**Alteração no Prisma schema:**
```prisma
enum Role {
  ADMIN
  GESTOR
  COLABORADOR
  SUPER_USER  // Novo
}
```

**Criar seed com:**
```javascript
// Seed para criar user super_user
const adminUser = await prisma.user.upsert({
  where: { email: "admin@aguimicell.com" },
  update: { role: "SUPER_USER" },
  create: {
    email: "admin@aguimicell.com",
    name: "Admin Developer",
    password: "hash...", // Deve já existir
    role: "SUPER_USER"
  }
})
```

**Impacto no frontend:** Permitiria trocar de email-check para role-check no futuro

---

## 📋 Checklist para Backend

- [ ] **CRÍTICO:** Executar `npx prisma generate && npx prisma db push` no diretório backend
- [ ] Verificar se `/api/users` está retornando dados corretamente
- [ ] Verificar se `FONENINJA_EMAIL` e `FONENINJA_PASSWORD` estão configurados no `.env`
- [ ] (Opcional) Implementar endpoints `/api/feature-flags` e `PATCH /api/feature-flags/:flagId` 
- [ ] (Opcional) Criar role `SUPER_USER` no Prisma e seed para `admin@aguimicell.com`

---

## 🔗 Referências no Frontend

**Arquivos que podem ser atualizados quando backend implementar persistência:**

1. `lib/feature-flags.ts` - Remove hardcodes, busca do backend
2. `components/super-usuario/feature-flag-toggle.tsx` - Chamada PATCH para API
3. `lib/feature-flag-provider.ts` - Integra com fetch de `/api/feature-flags`

---

## ✅ Status Resumido

| Item | Status | Prioridade |
|------|--------|-----------|
| Regenerar Prisma | ⏳ Aguardando Backend | 🔴 CRÍTICA |
| Feature Flags em Memória | ✅ Pronto | ✅ Deploy |
| Super User Dashboard (email) | ✅ Pronto | ✅ Deploy |
| Real Data Integration | ✅ Pronto | ✅ Deploy |
| Persistência Feature Flags | 🔲 Future | 🟡 v2 |
| Super User Role | 🔲 Future | 🟡 v2 |

