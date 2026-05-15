import { test } from "@playwright/test"
import path from "path"
import fs from "fs"

const BASE_URL = "http://localhost:3000"
const CREDS = { email: "admin@guimicell.com", password: "TestAdmin2025!" }
const OUT = path.join(process.cwd(), "screenshots")

async function solveCaptchaAndLogin(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('[name="email"]', { timeout: 10000 })
  await page.fill('[name="email"]', CREDS.email)
  await page.fill('[name="password"]', CREDS.password)

  // Wait for captcha question to appear (not "Calculando...")
  await page.waitForFunction(() => {
    const el = document.querySelector('.font-mono')
    return el && el.textContent && el.textContent.includes('?') && !el.textContent.includes('Calculando')
  }, { timeout: 10000 })

  const question = await page.textContent('.font-mono') || ""
  const m = question.match(/(\d+)\s*([+\-])\s*(\d+)/)
  if (m) {
    const [, a, op, b] = m
    const answer = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
    await page.fill('input[placeholder="?"]', String(answer))
  }

  await page.waitForTimeout(300)
  await page.click('button[type="submit"]:not([disabled])')
  await page.waitForURL(`${BASE_URL}/`, { timeout: 20000 })
}

const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "financeiro", path: "/financeiro" },
  { name: "comercial", path: "/comercial" },
  { name: "ranking", path: "/colaboradores" },
  { name: "integracoes", path: "/integracoes" },
  { name: "agenda", path: "/agenda" },
  { name: "operacao", path: "/operacao" },
  { name: "configuracoes", path: "/configuracoes" },
  { name: "suporte", path: "/suporte" },
]

test.describe("Visual Validation", () => {
  test("desktop 1280x800", async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true })
    await page.setViewportSize({ width: 1280, height: 800 })
    const consoleErrors: string[] = []
    page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()) })
    await solveCaptchaAndLogin(page)

    for (const p of PAGES) {
      await page.goto(`${BASE_URL}${p.path}`)
      await page.waitForTimeout(2500)
      await page.screenshot({ path: path.join(OUT, `${p.name}-desktop.png`), fullPage: true })
      console.log(`✓ ${p.name}`)
    }
    if (consoleErrors.length) console.log("Console errors:", consoleErrors.slice(0, 5).join("\n"))
  })

  test("mobile 390x844", async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await solveCaptchaAndLogin(page)
    for (const p of ["dashboard", "financeiro", "comercial"]) {
      const cfg = PAGES.find(x => x.name === p)!
      await page.goto(`${BASE_URL}${cfg.path}`)
      await page.waitForTimeout(2000)
      await page.screenshot({ path: path.join(OUT, `${p}-mobile.png`), fullPage: true })
      console.log(`✓ mobile ${p}`)
    }
  })
})
