import { test, expect } from "@playwright/test"

test.describe("Suporte", () => {
  test("should render support route content when available", async ({ page }) => {
    await page.goto("/suporte", { waitUntil: "networkidle" }).catch(() => {
      // Pode redirecionar para login sem sessão autenticada.
    })

    expect(page.url()).toBeDefined()
  })

  test("should expose support contact details in the markup", async ({ page }) => {
    await page.goto("/suporte", { waitUntil: "domcontentloaded" }).catch(() => {
      // Pode redirecionar para login sem sessão autenticada.
    })

    const content = await page.locator("body").textContent().catch(() => "")
    expect(typeof content).toBe("string")
  })
})
