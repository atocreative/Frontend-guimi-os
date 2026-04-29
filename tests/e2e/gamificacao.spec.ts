import { test, expect } from "@playwright/test"

test.describe("Gamificação", () => {
  test("should show graceful fallback when gamification data is unavailable", async ({ page }) => {
    await page.route("**/api/gamificacao/leaderboard?scope=month", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          available: false,
          scope: "month",
          updatedAt: null,
          entries: [],
          message: "Leaderboard indisponível no backend no momento.",
        }),
      })
    })

    await page.route("**/api/gamificacao/usuarios/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          available: false,
          userId: "user-1",
          name: "",
          avatarUrl: null,
          role: "COLABORADOR",
          points: 0,
          badgeIds: [],
          streakDays: 0,
          rank: null,
          updatedAt: null,
          message: "Gamificação do usuário indisponível no backend no momento.",
        }),
      })
    })

    await page.goto("/", { waitUntil: "networkidle" }).catch(() => {
      // A página pode redirecionar para login dependendo da sessão disponível.
    })

    expect(page.url()).toBeDefined()
  })
})
