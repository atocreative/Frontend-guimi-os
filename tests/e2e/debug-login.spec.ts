import { test, expect } from "@playwright/test"

test("Debug: Screenshot login form", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(2000)

  // Tirar screenshot da página
  await page.screenshot({ path: "login-page.png", fullPage: true })
  console.log("Screenshot salvo: login-page.png")

  // Log dos elementos do formulário
  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')
  const submitButton = await page.$('button[type="submit"]')

  console.log("Email input found:", !!emailInput)
  console.log("Password input found:", !!passwordInput)
  console.log("Submit button found:", !!submitButton)

  if (submitButton) {
    const isDisabled = await submitButton.isDisabled()
    console.log("Submit button disabled:", isDisabled)

    const buttonText = await submitButton.textContent()
    console.log("Submit button text:", buttonText)
  }
})

test("Debug: Try to fill form and check validation", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(2000)

  // Preencher email
  const emailInput = await page.$('input[type="email"]')
  if (emailInput) {
    await emailInput.fill("admin@aguimicell.com")
    console.log("Email filled")
  }

  // Preencher senha
  const passwordInput = await page.$('input[type="password"]')
  if (passwordInput) {
    await passwordInput.fill("aguimicell123")
    console.log("Password filled")
  }

  await page.waitForTimeout(1000)

  // Verificar se há erros visíveis
  const errorMessages = await page.$$('.error, [role="alert"], .text-red-500, .text-destructive')
  console.log("Error messages found:", errorMessages.length)

  for (let i = 0; i < errorMessages.length; i++) {
    const text = await errorMessages[i].textContent()
    console.log(`Error ${i + 1}:`, text)
  }

  // Tirar screenshot com formulário preenchido
  await page.screenshot({ path: "login-form-filled.png", fullPage: true })
  console.log("Screenshot salvo: login-form-filled.png")

  // Verificar botão
  const submitButton = await page.$('button[type="submit"]')
  if (submitButton) {
    const isDisabled = await submitButton.isDisabled()
    console.log("Submit button disabled after filling:", isDisabled)
  }
})
