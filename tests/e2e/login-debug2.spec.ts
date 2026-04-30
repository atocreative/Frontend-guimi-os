import { test, expect } from "@playwright/test"

test("Debug login flow", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(1000)

  console.log("\n=== INICIANDO LOGIN ===")

  // Preencher formulário
  await page.fill('input[type="email"]', "admin@aguimicell.com")
  await page.fill('input[type="password"]', "aguimicell123")

  // Resolver CAPTCHA
  const captchaQuestion = await page.textContent('[data-testid="captcha-question"]')
  const match = captchaQuestion?.match(/(\d+)\s*([\+\-])\s*(\d+)/)
  if (!match) throw new Error("Regex não funcionou")

  const left = parseInt(match[1])
  const operator = match[2]
  const right = parseInt(match[3])
  const answer = operator === "+" ? left + right : left - right

  console.log(`Captcha: ${left} ${operator} ${right} = ${answer}`)

  await page.fill('[data-testid="captcha-input"]', String(answer))

  // Monitorar erros e logs da página
  page.on("console", (msg) => {
    console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`)
  })

  // Clique no submit
  await page.click('button[type="submit"]')
  console.log("Botão clicado")

  // Esperar um pouco para qualquer erro aparecer
  await page.waitForTimeout(2000)

  // Verificar se há mensagem de erro visível
  const errorElement = await page.$('.rounded-lg.border.border-red-500')
  if (errorElement) {
    const errorText = await errorElement.textContent()
    console.log("❌ Erro encontrado:", errorText)
  }

  // Verificar URL atual
  const currentUrl = page.url()
  console.log("URL atual:", currentUrl)

  // Verificar se página ainda está em /login
  if (currentUrl.includes("/login")) {
    console.log("⚠️ Ainda na página de login")

    // Tirar screenshot para debug
    await page.screenshot({ path: "login-error.png", fullPage: true })
    console.log("Screenshot salvo: login-error.png")

    // Verificar todo o HTML da página para entender o erro
    const bodyHTML = await page.content()
    if (bodyHTML.includes("401") || bodyHTML.includes("unauthorized")) {
      console.log("❌ Erro 401 - Credenciais inválidas")
    }
    if (bodyHTML.includes("500") || bodyHTML.includes("erro")) {
      console.log("❌ Erro 500 - Backend error")
    }
  } else {
    console.log("✅ Redirecionado para:", currentUrl)
  }
})
