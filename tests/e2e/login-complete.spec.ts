import { test, expect } from "@playwright/test"

test("Complete login with CAPTCHA", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(1000)

  // 1. Preencher email
  await page.fill('input[type="email"]', "admin@aguimicell.com")

  // 2. Preencher senha
  await page.fill('input[type="password"]', "aguimicell123")

  // 3. Resolver o CAPTCHA
  // O desafio é algo como "Quanto é 5 + 3?" e a resposta é "8"
  const captchaQuestion = await page.textContent('[data-testid="captcha-question"]')
  console.log("Captcha question:", captchaQuestion)

  // Extrair os números e operador da questão
  // Exemplo: "Quanto é 5 + 3?" -> números são 5 e 3, operador é +
  const match = captchaQuestion?.match(/(\d+)\s*([\+\-])\s*(\d+)/)
  if (!match) {
    throw new Error(`Não consegui extrair números da questão: ${captchaQuestion}`)
  }

  const left = parseInt(match[1])
  const operator = match[2]
  const right = parseInt(match[3])

  let answer: number
  if (operator === "+") {
    answer = left + right
  } else if (operator === "-") {
    answer = left - right
  } else {
    throw new Error(`Operador desconhecido: ${operator}`)
  }

  console.log(`Calculado: ${left} ${operator} ${right} = ${answer}`)

  // 4. Preencher resposta do CAPTCHA
  await page.fill('[data-testid="captcha-input"]', String(answer))

  // 5. Clicar no botão de entrar
  const submitButton = await page.$('button[type="submit"]')
  const isDisabled = await submitButton?.isDisabled()
  console.log("Submit button disabled after solving CAPTCHA:", isDisabled)

  if (isDisabled) {
    throw new Error("Submit button ainda está desativado após resolver o CAPTCHA")
  }

  // 6. Enviar formulário
  await submitButton?.click()

  // 7. Esperar redirecionamento para o dashboard
  await page.waitForURL(/\/$/, { timeout: 10000 })
  console.log("✅ Login bem-sucedido! Redirecionado para dashboard")

  // 8. Verificar que dashboard carregou
  const mainElement = await page.$("main")
  expect(mainElement).toBeTruthy()
})
