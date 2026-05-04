import { test, expect } from "@playwright/test"

test("Verify getMonthBounds ReferenceError is fixed", async ({ page }) => {
  // Navigate directly to dashboard (assumes already logged in via context)
  await page.goto("/")

  // Check that page loads without getMonthBounds ReferenceError
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text())
    }
  })

  // Wait for page to fully load and check for navigation
  await page.waitForTimeout(3000)

  // Filter for getMonthBounds errors
  const getMonthBoundsErrors = errors.filter((e) =>
    e.includes("getMonthBounds") || e.includes("is not defined")
  )

  // Should have no getMonthBounds ReferenceError
  expect(getMonthBoundsErrors).toEqual([])
})
