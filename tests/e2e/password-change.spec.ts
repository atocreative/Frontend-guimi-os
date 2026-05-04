import { test, expect } from "@playwright/test"

async function solveCaptcha(page: import("@playwright/test").Page) {
  const question = await page.locator('[data-testid="captcha-question"]').textContent()
  const match = question?.match(/Quanto é (\d+) ([+-]) (\d+)\?/)
  if (!match) return

  const left = Number(match[1])
  const operator = match[2]
  const right = Number(match[3])
  const answer = operator === "+" ? left + right : left - right
  await page.locator('[data-testid="captcha-input"]').fill(String(answer))
}

async function loginAsUser(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login")

  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')

  await emailInput.fill(email)
  await passwordInput.fill(password)
  await solveCaptcha(page)
  await submitButton.click()

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 })
}

test.describe("Password Change Flows", () => {
  test("SUPER_USER should be able to change their own password via Profile modal", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Find and click the avatar/profile button in the header
    const avatarButton = page.locator('button[class*="ghost"]').filter({ hasText: /[A-Z]/ }).first()
    await avatarButton.click()

    // Click "Perfil" menu item
    const profileMenuItem = page.locator('text=Perfil').first()
    await expect(profileMenuItem).toBeVisible()
    await profileMenuItem.click()

    // Modal should open
    const profileModal = page.locator('text=Alterar Senha')
    await expect(profileModal).toBeVisible()

    // Fill in password fields
    const newPasswordInput = page.locator('input[placeholder="Digite a nova senha"]')
    const confirmPasswordInput = page.locator('input[placeholder="Confirme a nova senha"]')

    await newPasswordInput.fill("newpassword123")
    await confirmPasswordInput.fill("newpassword123")

    // Click save button
    const saveButton = page.locator('button:has-text("Salvar")').last()
    await saveButton.click()

    // Check for success toast
    const successToast = page.locator('text=Senha alterada com sucesso')
    await expect(successToast).toBeVisible({ timeout: 5000 })

    // Modal should close
    const modal = page.locator('text=Alterar Senha')
    await expect(modal).not.toBeVisible()
  })

  test("Profile modal should validate password length", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Open profile modal
    const avatarButton = page.locator('button[class*="ghost"]').filter({ hasText: /[A-Z]/ }).first()
    await avatarButton.click()

    const profileMenuItem = page.locator('text=Perfil').first()
    await profileMenuItem.click()

    // Fill in a password that's too short
    const newPasswordInput = page.locator('input[placeholder="Digite a nova senha"]')
    const confirmPasswordInput = page.locator('input[placeholder="Confirme a nova senha"]')

    await newPasswordInput.fill("123")
    await confirmPasswordInput.fill("123")

    // Click save button
    const saveButton = page.locator('button:has-text("Salvar")').last()
    await saveButton.click()

    // Check for validation error
    const errorToast = page.locator('text=Senha deve ter no mínimo 6 caracteres')
    await expect(errorToast).toBeVisible({ timeout: 5000 })
  })

  test("Profile modal should validate passwords match", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Open profile modal
    const avatarButton = page.locator('button[class*="ghost"]').filter({ hasText: /[A-Z]/ }).first()
    await avatarButton.click()

    const profileMenuItem = page.locator('text=Perfil').first()
    await profileMenuItem.click()

    // Fill in mismatched passwords
    const newPasswordInput = page.locator('input[placeholder="Digite a nova senha"]')
    const confirmPasswordInput = page.locator('input[placeholder="Confirme a nova senha"]')

    await newPasswordInput.fill("newpassword123")
    await confirmPasswordInput.fill("differentpassword")

    // Click save button
    const saveButton = page.locator('button:has-text("Salvar")').last()
    await saveButton.click()

    // Check for validation error
    const errorToast = page.locator('text=Senhas não conferem')
    await expect(errorToast).toBeVisible({ timeout: 5000 })
  })

  test("Profile modal should validate empty password field", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Open profile modal
    const avatarButton = page.locator('button[class*="ghost"]').filter({ hasText: /[A-Z]/ }).first()
    await avatarButton.click()

    const profileMenuItem = page.locator('text=Perfil').first()
    await profileMenuItem.click()

    // Don't fill in password, just click save
    const saveButton = page.locator('button:has-text("Salvar")').last()
    await saveButton.click()

    // Check for validation error
    const errorToast = page.locator('text=Digite a nova senha')
    await expect(errorToast).toBeVisible({ timeout: 5000 })
  })

  test("SUPER_USER should see password field when editing another user", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Navigate to Configurações
    const configLink = page.locator('text=Configurações')
    await expect(configLink).toBeVisible()
    await configLink.click()

    // Wait for page to load
    await page.waitForURL(/\/configuracoes/, { timeout: 10000 })

    // Find a user card and click edit
    const userCards = page.locator('[class*="usuario-card"]')
    const firstUserCard = userCards.first()

    if (await firstUserCard.isVisible()) {
      const editButton = firstUserCard.locator('button:has-text("Editar")')
      if (await editButton.isVisible()) {
        await editButton.click()

        // Modal should open
        const editUserModal = page.locator('text=Editar Usuário')
        await expect(editUserModal).toBeVisible({ timeout: 5000 })

        // Password field should be visible for SUPER_USER
        const newPasswordField = page.locator('input[placeholder="Deixe em branco para manter a senha atual"]')
        await expect(newPasswordField).toBeVisible()
      }
    }
  })

  test("ADMIN should NOT see password field when editing another user", async ({ page }) => {
    await loginAsUser(page, "admin@guimicell.com", "12345678")

    // Navigate to Configurações
    const configLink = page.locator('text=Configurações')
    await expect(configLink).toBeVisible()
    await configLink.click()

    // Wait for page to load
    await page.waitForURL(/\/configuracoes/, { timeout: 10000 })

    // Find a user card and click edit
    const userCards = page.locator('[class*="usuario-card"]')
    const firstUserCard = userCards.first()

    if (await firstUserCard.isVisible()) {
      const editButton = firstUserCard.locator('button:has-text("Editar")')
      if (await editButton.isVisible()) {
        await editButton.click()

        // Modal should open
        const editUserModal = page.locator('text=Editar Usuário')
        await expect(editUserModal).toBeVisible({ timeout: 5000 })

        // Password field should NOT be visible for ADMIN
        const newPasswordField = page.locator('input[placeholder="Deixe em branco para manter a senha atual"]')
        await expect(newPasswordField).not.toBeVisible()
      }
    }
  })

  test("SUPER_USER can change another user's password in edit modal", async ({ page }) => {
    await loginAsUser(page, "super@guimicell.com", "superpass123")

    // Navigate to Configurações
    const configLink = page.locator('text=Configurações')
    await expect(configLink).toBeVisible()
    await configLink.click()

    // Wait for page to load
    await page.waitForURL(/\/configuracoes/, { timeout: 10000 })

    // Find a user card and click edit
    const userCards = page.locator('[class*="usuario-card"]')
    const firstUserCard = userCards.first()

    if (await firstUserCard.isVisible()) {
      const editButton = firstUserCard.locator('button:has-text("Editar")')
      if (await editButton.isVisible()) {
        await editButton.click()

        // Modal should open
        const editUserModal = page.locator('text=Editar Usuário')
        await expect(editUserModal).toBeVisible({ timeout: 5000 })

        // Fill in password
        const newPasswordField = page.locator('input[placeholder="Deixe em branco para manter a senha atual"]')
        await newPasswordField.fill("newuserpassword123")

        // Click save
        const saveButton = page.locator('button:has-text("Salvar")').last()
        await saveButton.click()

        // Check for success message
        const successToast = page.locator('text=atualizado com sucesso')
        await expect(successToast).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
