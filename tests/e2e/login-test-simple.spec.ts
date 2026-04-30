import { test, expect } from "@playwright/test"

/**
 * Simple login test to debug the authentication flow
 */
test("Simple login test with detailed logging", async ({ page }) => {
  // Navigate to login
  console.log("🔐 Starting login test...")
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(1000)

  // Check if page loaded
  const loginHeading = await page.$("h1")
  console.log("Login page heading:", await loginHeading?.textContent())

  // Check CAPTCHA challenge loads
  const captchaQuestion = await page.textContent('[data-testid="captcha-question"]')
  console.log("CAPTCHA question:", captchaQuestion)

  if (!captchaQuestion || captchaQuestion.includes("Carregando")) {
    console.warn("⚠️ CAPTCHA not loaded yet, waiting...")
    await page.waitForTimeout(2000)
  }

  // Solve CAPTCHA
  const question = await page.textContent('[data-testid="captcha-question"]')
  console.log("Final CAPTCHA question:", question)

  const match = question?.match(/(\d+)\s*([\+\-])\s*(\d+)/)
  if (!match) {
    throw new Error(`Failed to parse CAPTCHA: ${question}`)
  }

  const left = parseInt(match[1])
  const operator = match[2]
  const right = parseInt(match[3])
  const answer = operator === "+" ? left + right : left - right
  console.log(`✓ CAPTCHA solved: ${left} ${operator} ${right} = ${answer}`)

  // Fill form
  await page.fill('input[type="email"]', "admin@guimicell.com")
  await page.fill('input[type="password"]', "atoadm2026")
  await page.fill('[data-testid="captcha-input"]', String(answer))

  // Check button enabled
  const submitButton = await page.$('button[type="submit"]')
  const isDisabled = await submitButton?.isDisabled()
  console.log(`Submit button disabled: ${isDisabled}`)

  if (isDisabled) {
    throw new Error("Submit button is disabled after solving CAPTCHA")
  }

  // Monitor network requests
  const responses: Array<{ url: string; status: number }> = []
  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      responses.push({
        url: response.url(),
        status: response.status(),
      })
      console.log(`API Response: ${response.status()} ${response.url()}`)
    }
  })

  // Monitor console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`🔴 Browser error: ${msg.text()}`)
    }
  })

  // Submit form
  console.log("📤 Submitting login form...")
  await submitButton?.click()

  // Wait for navigation or error
  try {
    await page.waitForURL(/\/$/, { timeout: 5000 })
    console.log("✅ Login successful! Redirected to dashboard")
  } catch {
    console.log("⏱️ No redirect after 5s, checking for errors...")

    // Check for error message
    const errorElement = await page.$(".rounded-lg.border.border-red-500")
    if (errorElement) {
      const errorText = await errorElement.textContent()
      console.log(`❌ Error message: ${errorText}`)
    }

    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)

    // Log all API responses
    console.log("\n📊 API Responses:")
    responses.forEach((r) => {
      console.log(`  ${r.status} ${r.url}`)
    })

    throw new Error("Login failed - see logs above")
  }
})
