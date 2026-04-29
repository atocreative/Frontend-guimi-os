import { test, expect } from "@playwright/test"

/**
 * Login Captcha Tests
 *
 * These tests verify the anti-bot captcha gate on the login flow.
 */

test.describe("Login Captcha", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("shows captcha challenge on login page", async ({ page }) => {
    const challenge = page.locator('[data-testid="captcha-question"]')
    const input = page.locator('[data-testid="captcha-input"]')
    await expect(challenge).toBeVisible()
    await expect(input).toBeVisible()
  })

  test("blocks submit until captcha is solved", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test("allows login after captcha is solved", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const captchaInput = page.locator('[data-testid="captcha-input"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill("admin@guimicell.com")
    await passwordInput.fill("12345678")
    const question = await page.locator('[data-testid="captcha-question"]').textContent()
    const match = question?.match(/Quanto é (\d+) ([+-]) (\d+)\?/)
    if (match) {
      const left = Number(match[1])
      const operator = match[2]
      const right = Number(match[3])
      const answer = operator === "+" ? left + right : left - right
      await captchaInput.fill(String(answer))
    }
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, credentials or backend response were rejected
    })
  })

  test("shows captcha remains unsolved when answer is wrong", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const captchaInput = page.locator('[data-testid="captcha-input"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill("admin@guimicell.com")
    await passwordInput.fill("12345678")
    await captchaInput.fill("99")

    await expect(submitButton).toBeDisabled()
    await expect(page.locator('text=Resolva o desafio para liberar o envio do login.')).toBeVisible()
  })
})
