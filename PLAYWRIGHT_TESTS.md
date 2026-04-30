# Testes com Playwright - GuimiCell OS Frontend

## 📋 Checklist de Testes Manuais

### 1️⃣ Login e Autenticação
- [ ] Acessar `http://localhost:3000/login`
- [ ] Fazer login com `admin@aguimicell.com`
- [ ] Verificar se redirecionou para dashboard
- [ ] Verificar se nome do usuário aparece no header

### 2️⃣ Dashboard Principal
- [ ] Página carrega sem erros
- [ ] KPIs mostram dados reais (não "Aguardando dados")
- [ ] Tarefas aparecem corretamente
- [ ] Gráficos renderizam

### 3️⃣ Financeiro
- [ ] Acessar `/financeiro`
- [ ] Verificar se mostra:
  - [ ] Faturamento do Mês (dados reais do Fone Ninja)
  - [ ] Lucro Líquido e Bruto
  - [ ] Total de Despesas
  - [ ] Saldo em Caixa
- [ ] Tabela de Entradas mostra vendas reais
- [ ] Gráficos renderizam

### 4️⃣ Indicadores
- [ ] Acessar `/indicadores`
- [ ] Verificar se mostra:
  - [ ] Conversão Média (dados reais)
  - [ ] Ticket Médio Geral
  - [ ] Total de Vendas
  - [ ] Melhor Vendedor
- [ ] Ranking de Performance mostra colaboradores
- [ ] Gráfico de Evolução mostra dados de 30 dias

### 5️⃣ Feature Flags & Menu
- [ ] Menu mostra apenas itens habilitados:
  - [ ] ✅ Dashboard (sempre ativo)
  - [ ] ✅ Financeiro (sempre ativo)
  - [ ] ✅ Indicadores (sempre ativo)
  - [ ] ✅ Agenda e Tarefas (sempre ativo)
  - [ ] ✅ Configurações (sempre ativo)
  - [ ] ❌ Comercial (desativado - "Em breve")
  - [ ] ❌ Operação (desativado - "Em breve")
  - [ ] ❌ Processos (desativado - "Em breve")

### 6️⃣ Super User Dashboard (admin@aguimicell.com)
- [ ] Menu lateral mostra seção "Desenvolvedor" com "Developer Dashboard"
- [ ] Acessar `/super-usuario`
- [ ] Verificar se lista todas as Feature Flags:
  - [ ] DASHBOARD
  - [ ] COMERCIAL
  - [ ] FINANCEIRO
  - [ ] OPERACAO
  - [ ] AGENDA
  - [ ] PROCESSOS
  - [ ] COLABORADORES
  - [ ] INDICADORES
  - [ ] CONFIGURACOES
  - [ ] SUPORTE
- [ ] Clicar em toggle para desativar/ativar feature
- [ ] Verificar se menu lateral atualiza em tempo real
- [ ] Recarregar página - flags resetam (em memória)

### 7️⃣ Configurações - Integrações
- [ ] Acessar `/configuracoes`
- [ ] Clicar na aba "Integrações"
- [ ] Verificar se mostra 3 cards:
  - [ ] Fone Ninja (deve mostrar CONECTADO ou DESCONECTADO baseado em status HTTP)
  - [ ] Kommo CRM (baseado em KOMMO_BASE_URL)
  - [ ] Meu Assessor (baseado em MEU_ASSESSOR_URL)
- [ ] Cada card deve mostrar:
  - [ ] Status (CONECTADO/DESCONECTADO)
  - [ ] Ícone colorido (verde/vermelho)
  - [ ] Última sincronização (timestamp)

### 8️⃣ Header & Footer
- [ ] Header mostra logo corretamente
- [ ] Nome do usuário e email no menu do header
- [ ] Footer aparece apenas uma vez no final da página
- [ ] Footer tem cores consistentes com header (mesmo padrão de cor)
- [ ] Modo escuro/claro funciona em todo lugar

### 9️⃣ Menu para Usuário NÃO super user
- [ ] Login com outro usuário (ADMIN, GESTOR ou COLABORADOR)
- [ ] Seção "Desenvolvedor" NÃO aparece
- [ ] Tentando acessar `/super-usuario` diretamente → redireciona para `/`

### 🔟 Dados Reais vs Mock
- [ ] Financeiro: Não mostra dados mockados, mostra dados reais do Fone Ninja
- [ ] Indicadores: Não mostra dados mockados, mostra dados reais do backend
- [ ] Se alguma API falhar, mostra warning "⚠️ Dados indisponíveis"

---

## 🎭 Testes Automatizados com Playwright

### Setup
```bash
cd C:\Users\xgame\frontend-guimi-os

# Instalar Playwright se não estiver instalado
npm install -D @playwright/test

# Rodar testes
npx playwright test

# Rodar em modo debug
npx playwright test --debug

# Rodar teste específico
npx playwright test tests/dashboard.spec.ts
```

### Exemplos de Testes

**Teste 1: Login e Dashboard**
```typescript
import { test, expect } from '@playwright/test'

test('login and see dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  
  // Preencher form de login
  await page.fill('input[type="email"]', 'admin@aguimicell.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Entrar")')
  
  // Esperar redirecionamento
  await page.waitForURL('http://localhost:3000/')
  
  // Verificar que dashboard carregou
  await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible()
})
```

**Teste 2: Developer Dashboard Visible**
```typescript
test('super user sees developer dashboard', async ({ page }) => {
  // Primeiro fazer login como admin@aguimicell.com
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'admin@aguimicell.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Entrar")')
  
  await page.waitForURL('http://localhost:3000/')
  
  // Verificar que "Developer Dashboard" aparece no sidebar
  await expect(page.locator('text=Developer Dashboard')).toBeVisible()
  
  // Navegar para developer dashboard
  await page.click('a:has-text("Developer Dashboard")')
  await page.waitForURL('http://localhost:3000/super-usuario')
  
  // Verificar que feature flags aparecem
  await expect(page.locator('text=DASHBOARD')).toBeVisible()
  await expect(page.locator('text=COMERCIAL')).toBeVisible()
})
```

**Teste 3: Feature Flags**
```typescript
test('toggle feature flag updates menu', async ({ page }) => {
  // Login como admin
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'admin@aguimicell.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Entrar")')
  
  // Ir para super usuario
  await page.click('a:has-text("Developer Dashboard")')
  await page.waitForURL('http://localhost:3000/super-usuario')
  
  // Desativar COMERCIAL
  const comercialToggle = page.locator('[data-testid="flag-toggle-COMERCIAL"]')
  await comercialToggle.click()
  
  // Voltar para dashboard
  await page.click('a:has-text("Dashboard")')
  
  // Verificar que COMERCIAL agora tem "Em breve"
  await expect(page.locator('text=Comercial:has-text("Em breve")')).toBeVisible()
})
```

**Teste 4: Integração Health Check**
```typescript
test('integration status shows connection status', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'admin@aguimicell.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Entrar")')
  
  // Ir para configurações
  await page.click('a:has-text("Configurações")')
  
  // Clicar em Integrações
  await page.click('button:has-text("Integrações")')
  
  // Verificar que cards de integrações aparecem
  await expect(page.locator('text=Fone Ninja')).toBeVisible()
  await expect(page.locator('text=Kommo CRM')).toBeVisible()
  await expect(page.locator('text=Meu Assessor')).toBeVisible()
  
  // Verificar status
  const foneNinjaStatus = page.locator('text=CONECTADO, text=DESCONECTADO, text=ERRO')
  await expect(foneNinjaStatus).toBeTruthy()
})
```

---

## 📊 O que Testar Priorizado

### 🔴 CRÍTICO (testar primeiro)
1. Login funciona
2. Dashboard carrega sem erros
3. Super User Dashboard aparece para admin@aguimicell.com
4. Menu mostra/esconde items corretamente

### 🟡 IMPORTANTE
1. Dados reais aparecem (Financeiro, Indicadores)
2. Integração health checks funcionam
3. Feature flags podem ser toggleadas

### 🟢 DESEJÁVEL
1. Aparência em modo escuro/claro
2. Responsividade mobile
3. Performance (carregamento rápido)

---

## 🚀 Próximos Passos

1. Reiniciar backend: `npm run dev`
2. Esperar frontend carregar: `http://localhost:3000`
3. Fazer login com `admin@aguimicell.com`
4. Percorrer os 10 testes acima
5. Se tudo passar ✅ - Temos uma versão pronta para usar!
6. Se algo falhar ❌ - Documentar o erro e corrigir
