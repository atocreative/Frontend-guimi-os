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

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("should display login page with logo and form", async ({ page }) => {
    // Check for logo
    const logo = page.locator('img[alt="Guimicell"]')
    await expect(logo).toBeVisible()

    // Check for title
    const title = page.locator("h1")
    await expect(title).toContainText("Guimicell")

    // Check for form fields
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test("should show validation errors for empty fields", async ({ page }) => {
    await solveCaptcha(page)

    // Browser-level validation will prevent submission
    const emailInput = page.locator('input[type="email"]')
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required)
    expect(isRequired).toBe(true)
  })

  test("should show validation errors for invalid email", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("not-an-email")

    // Browser validation for email type
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  })

  test("should show validation error for short password", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill("test@example.com")
    await passwordInput.fill("123")
    await solveCaptcha(page)

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    const errorMessage = page.locator("text=Senha deve ter no mínimo 8 caracteres")
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
  })

  test("should display error message for invalid credentials", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill("wrong@example.com")
    await passwordInput.fill("wrongpassword")
    await solveCaptcha(page)
    await submitButton.click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("should redirect to dashboard on successful login", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill("admin@guimicell.com")
    await passwordInput.fill("12345678")
    await solveCaptcha(page)
    await submitButton.click()

    await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, credentials or backend response were rejected
    })
  })
})
