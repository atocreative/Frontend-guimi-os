import { test, expect } from "@playwright/test"

test("Debug: Analyze form validation state", async ({ page }) => {
  await page.goto("http://localhost:3000/login")
  await page.waitForTimeout(2000)

  console.log("=== INITIAL STATE ===")

  // Preencher email
  await page.fill('input[type="email"]', "admin@aguimicell.com")
  await page.fill('input[type="password"]', "aguimicell123")

  await page.waitForTimeout(500)

  console.log("\n=== AFTER FILLING FORM ===")

  // Procurar por atributos aria-invalid
  const emailInput = await page.$('input[type="email"]')
  if (emailInput) {
    const ariaInvalid = await emailInput.getAttribute("aria-invalid")
    const ariaDescribedBy = await emailInput.getAttribute("aria-describedby")
    console.log("Email - aria-invalid:", ariaInvalid)
    console.log("Email - aria-describedby:", ariaDescribedBy)

    // Procurar por elemento de erro linked
    if (ariaDescribedBy) {
      const errorElement = await page.$(`#${ariaDescribedBy}`)
      if (errorElement) {
        const errorText = await errorElement.textContent()
        console.log("Email error message:", errorText)
      }
    }
  }

  // Procurar por todos os elementos visíveis que contenham "erro", "error", "inválido"
  const allText = await page.evaluate(() => {
    const elements = document.querySelectorAll('*')
    const matches = []
    elements.forEach(el => {
      const text = el.textContent || ''
      if (text.toLowerCase().includes('erro') ||
          text.toLowerCase().includes('error') ||
          text.toLowerCase().includes('inválido') ||
          text.toLowerCase().includes('invalid')) {
        matches.push({
          tag: el.tagName,
          text: text.substring(0, 100),
          visible: el.offsetHeight > 0
        })
      }
    })
    return matches
  })

  console.log("\n=== ERROR MESSAGES FOUND ===")
  allText.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg.tag} (visible: ${msg.visible}): ${msg.text}`)
  })

  // Verificar o HTML do botão submit
  const submitButton = await page.$('button[type="submit"]')
  if (submitButton) {
    const html = await submitButton.evaluate(el => ({
      disabled: el.disabled,
      ariaDisabled: el.getAttribute('aria-disabled'),
      classList: Array.from(el.classList),
      parentHTML: el.parentElement?.outerHTML.substring(0, 200)
    }))
    console.log("\n=== SUBMIT BUTTON STATE ===")
    console.log(JSON.stringify(html, null, 2))
  }

  // Verificar form como um todo
  const form = await page.$('form')
  if (form) {
    const isValid = await form.evaluate(f => {
      return (f as HTMLFormElement).checkValidity()
    })
    console.log("\n=== FORM VALIDITY ===")
    console.log("Form.checkValidity():", isValid)
  }

  // Procurar por campos que podem estar inválidos
  const inputs = await page.$$('input')
  console.log("\n=== ALL INPUTS ===")
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const info = await input.evaluate((el: HTMLInputElement) => ({
      type: el.type,
      name: el.name,
      value: el.value,
      required: el.required,
      disabled: el.disabled,
      ariaInvalid: el.getAttribute('aria-invalid'),
      validity: {
        valid: el.validity.valid,
        valueMissing: el.validity.valueMissing,
        typeMismatch: el.validity.typeMismatch,
        patternMismatch: el.validity.patternMismatch,
        customError: el.validity.customError
      },
      validationMessage: el.validationMessage
    }))
    console.log(`Input ${i + 1}:`, JSON.stringify(info, null, 2))
  }
})
