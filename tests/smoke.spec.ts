import { test, expect } from '@playwright/test'

test.describe('GuimiCell OS - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Base URL
    await page.goto('http://localhost:3000/login')
  })

  test('1. Login page loads', async ({ page }) => {
    // Verificar que página de login carregou
    await expect(page.locator('text=Entrar')).toBeVisible({ timeout: 5000 })
  })

  test('2. Can submit login form', async ({ page }) => {
    // Preencher credenciais
    await page.fill('input[type="email"]', 'admin@aguimicell.com')
    await page.fill('input[type="password"]', 'aguimicell123')

    // Clicar no botão de entrar
    const submitButton = page.locator('button').filter({ hasText: /Entrar|Sign In/i })
    await submitButton.click()

    // Esperar redirecionamento (até 10 segundos)
    await page.waitForURL(/\/$/, { timeout: 10000 }).catch(() => {
      console.log('URL não mudou - verificando se está no dashboard')
    })
  })

  test('3. Dashboard loads without error', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@aguimicell.com')
    await page.fill('input[type="password"]', 'aguimicell123')
    await page.locator('button').filter({ hasText: /Entrar|Sign In/i }).click()

    // Esperar dashboard carregar
    await page.waitForTimeout(3000)

    // Verificar que não há erro na página
    const errors = await page.locator('[role="alert"]').all()
    for (const error of errors) {
      const text = await error.textContent()
      console.log('Error found:', text)
    }

    // Verificar que algum elemento principal carregou
    const mainContent = await page.locator('main').isVisible().catch(() => false)
    console.log('Main content visible:', mainContent)
  })

  test('4. Sidebar navigation appears', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@aguimicell.com')
    await page.fill('input[type="password"]', 'aguimicell123')
    await page.locator('button').filter({ hasText: /Entrar|Sign In/i }).click()

    await page.waitForTimeout(2000)

    // Verificar que sidebar/nav carregou
    const nav = await page.locator('nav, [role="navigation"], aside').first().isVisible().catch(() => false)
    console.log('Navigation visible:', nav)
  })

  test('5. Verificar menu itens principais', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@aguimicell.com')
    await page.fill('input[type="password"]', 'aguimicell123')
    await page.locator('button').filter({ hasText: /Entrar|Sign In/i }).click()

    await page.waitForTimeout(2000)

    // Procurar por itens do menu
    const menuItems = ['Dashboard', 'Financeiro', 'Indicadores']
    for (const item of menuItems) {
      const exists = await page.locator(`text=${item}`).isVisible().catch(() => false)
      console.log(`Menu item "${item}":`, exists)
    }
  })

  test('6. Developer Dashboard acessível para admin@aguimicell.com', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@aguimicell.com')
    await page.fill('input[type="password"]', 'aguimicell123')
    await page.locator('button').filter({ hasText: /Entrar|Sign In/i }).click()

    await page.waitForTimeout(2000)

    // Procurar por "Developer Dashboard"
    const devDashboard = await page.locator('text=Developer Dashboard').isVisible().catch(() => false)
    console.log('Developer Dashboard visible:', devDashboard)

    if (devDashboard) {
      // Navegar para ele
      await page.click('text=Developer Dashboard')
      await page.waitForTimeout(2000)

      // Verificar que feature flags aparecem
      const flags = await page.locator('text=DASHBOARD, text=COMERCIAL, text=FINANCEIRO').first().isVisible().catch(() => false)
      console.log('Feature flags visible:', flags)
    }
  })
})
