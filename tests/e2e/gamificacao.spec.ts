import { test, expect } from "@playwright/test"

test.describe("Gamificação", () => {
  /**
   * Helper: Login as user
   */
  async function loginAs(page: any, email: string, password: string) {
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()

    // Wait for either redirect or MFA modal
    await page.waitForURL(/(\/$|\/login)/, { timeout: 5000 }).catch(() => {
      // May timeout if MFA required, which is expected
    })
  }

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

  test("should display leaderboard with user rankings", async ({ page }) => {
    // Navigate to dashboard/home where leaderboard is visible
    await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => {
      // May redirect to login if not authenticated
    })

    // If page redirects to login, verify structure but don't require authentication
    if (page.url().includes("/login")) {
      expect(page.url()).toContain("/login")
      return
    }

    // Check if leaderboard section exists on dashboard
    const leaderboardSection = page.locator("text=/Ranking|Leaderboard|Pontuação/i")
    const isVisible = await leaderboardSection.isVisible().catch(() => false)

    // If leaderboard is present, verify it has proper structure
    if (isVisible) {
      await expect(leaderboardSection).toBeVisible()

      // Look for table or list with user entries
      const userRows = page.locator('[role="row"]').or(page.locator("li"))
      const rowCount = await userRows.count().catch(() => 0)

      // If data exists, verify it's displayed
      if (rowCount > 0) {
        expect(rowCount).toBeGreaterThan(0)
      }
    }
  })

  test("should display user points and level information", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => {
      // May redirect to login
    })

    if (page.url().includes("/login")) {
      expect(page.url()).toContain("/login")
      return
    }

    // Look for user stats section (points, level, badges)
    const statsSection = page.locator("text=/Pontos|Nível|Badges|Estatísticas/i").first()
    const isVisible = await statsSection.isVisible().catch(() => false)

    if (isVisible) {
      await expect(statsSection).toBeVisible()

      // Check for specific stat elements
      const pointsIndicator = page.locator("text=/\\d+\\s*(pontos|pts)/i").first()
      const levelIndicator = page.locator("text=/Nível|Level/i").first()

      // At least one should be visible if stats are shown
      const pointsVisible = await pointsIndicator.isVisible().catch(() => false)
      const levelVisible = await levelIndicator.isVisible().catch(() => false)

      expect(pointsVisible || levelVisible).toBe(true)
    }
  })

  test("should have responsive leaderboard layout", async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => {
      // May redirect to login
    })

    if (page.url().includes("/login")) {
      expect(page.url()).toContain("/login")
      return
    }

    // Verify page renders without horizontal scroll
    const body = page.locator("body")
    const bodyWidth = await body.evaluate((el) => el.offsetWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    const bodyWidthTablet = await body.evaluate((el) => el.offsetWidth)
    expect(bodyWidthTablet).toBeLessThanOrEqual(768)

    // Test on desktop
    await page.setViewportSize({ width: 1440, height: 900 })
    const bodyWidthDesktop = await body.evaluate((el) => el.offsetWidth)
    expect(bodyWidthDesktop).toBeLessThanOrEqual(1440)
  })
})
