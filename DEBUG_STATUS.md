# Status de Debug - 2026-04-30

## ✅ Problemas Corrigidos

1. **Contrato de Autenticação CAPTCHA**
   - Atualizado de `captchaSeed` para `captchaToken`
   - `lib/backend-api.ts`: ✅ Atualizado
   - `lib/api-client.ts`: ✅ Atualizado
   - `app/(auth)/login/page.tsx`: ✅ Implementado fetchCaptchaChallenge()

2. **Email do Super Usuário**
   - Corrigido de `admin@aguimicell.com` para `admin@guimicell.com`
   - `app/(dashboard)/super-usuario/page.tsx`: ✅ Atualizado
   - `components/layout/app-sidebar.tsx`: ✅ Atualizado

3. **Feature Flags & Proteção de Rotas**
   - ✅ `lib/route-protection.ts`: Criado com proteção de rotas
   - ✅ `lib/feature-flag-manager.ts`: Criado para gerenciar toggles em memória
   - ✅ `app/(dashboard)/access-denied/page.tsx`: Criado página de acesso negado
   - ✅ Super usuário pode desabilitar pages no Developer Dashboard

## ⚠️ Problemas Pendentes

### 1. Login Ainda Falhando
**Sintoma**: "Não foi possível entrar agora"  
**Possíveis Causas**:
- Backend `/api/auth/captcha` não acessível
- Credenciais inválidas para `admin@guimicell.com`
- Senha esperada não é "atoadm2026" ou "12345678"
- Token JWT não está sendo gerado corretamente

**Para debugar**:
```bash
# Run this test:
npx playwright test tests/e2e/login-test-simple.spec.ts --headed
```

### 2. Colaboradores Page - Dados Mockados
**Localização**: `components/colaboradores/colaboradores-client.tsx`  
**Problema**: 
- Importa `mockColaboradores`, `mockConquistas`, `mockIndicadoresTime`
- Usa dados mock como fallback (linhas 26-60)
- Mostra "mockConquistas.length" em vez de dados reais

**O que precisa fazer**:
- Remover importação de mock data
- Remover fallbacks para dados mock
- Usar apenas dados da API `/api/usuarios`
- Se faltarem campos, usar valores vazios/padrão

### 3. Dashboard - Faturamento Dia/Mês
**Status**: Código está pronto, mas pode não estar exibindo dados  
**Verificar**:
- Variáveis de ambiente Fone Ninja estão definidas?
  - `FONENINJA_BASE_URL`
  - `FONENINJA_LOJA_ID`
  - `FONENINJA_EMAIL`
  - `FONENINJA_PASSWORD`
  - `FONENINJA_TOKEN`

## 🔧 Senhas para Testar

Email: `admin@guimicell.com`
Senhas:
- `atoadm2026` ✓
- `12345678` ✓

## 📋 Checklist de Validação

- [ ] Login funciona com credenciais corretas
- [ ] Dashboard exibe faturamento do dia
- [ ] Dashboard exibe faturamento do mês
- [ ] Colaboradores mostra dados reais (sem mocks)
- [ ] Feature flags funcionam (desabilitar página remove do menu)
- [ ] Tentar acessar página desabilitada redireciona para /access-denied
- [ ] Apenas admin@guimicell.com vê Developer Dashboard
- [ ] Usuários com roles menores não conseguem acessar super-usuario

## 🚀 Próximas Ações

1. **Testar login** com o novo endpoint CAPTCHA
2. **Corrigir Colaboradores** removendo mock data
3. **Verificar Fone Ninja** env vars e conectividade
4. **Implementar proteção de rotas** para cada página disabilitada
