/**
 * Global auth setup for Playwright tests.
 *
 * Two modes (in priority order):
 *
 * 1. PLAYWRIGHT_SESSION_COOKIE — paste the `next-auth.session-token` cookie
 *    value from DevTools → Application → Cookies → localhost.
 *    Quickest: no API calls, just cookie injection.
 *
 * 2. PLAYWRIGHT_TOKEN — paste the backend accessToken from
 *    GET http://localhost:3000/api/auth/session (while logged in browser).
 *    Uses NextAuth credentials token-mode flow.
 *
 * How to get either value:
 *   a) Log into the app in a browser tab.
 *   b) DevTools → Application → Cookies → http://localhost:3000
 *   c) Copy `next-auth.session-token` → PLAYWRIGHT_SESSION_COOKIE
 *   OR
 *   d) DevTools → Network → /api/auth/session → Response Body → accessToken
 *      → PLAYWRIGHT_TOKEN
 *
 * Set whichever in .env (not .env.local — Playwright reads .env):
 *   PLAYWRIGHT_SESSION_COOKIE=eyJhbGciOiJ...
 *   PLAYWRIGHT_TOKEN=eyJhbGciOiJ...
 */

import { test as setup, expect } from "@playwright/test"
import path from "path"
import fs from "fs"

export const STORAGE_STATE = path.resolve("tests/e2e/.auth/state.json")

const TEST_USER = {
  id: "cmokgj8sw00001kefkt4x7d32",
  name: "Admin Developer",
  email: "admin@guimicell.com",
  role: "SUPER_USER",
  isSuperUser: true,
  jobTitle: "Super User",
}

setup("authenticate via session", async ({ page, context }) => {
  // ── Mode 1: Direct session cookie injection ──────────────────────────────
  const sessionCookie = process.env.PLAYWRIGHT_SESSION_COOKIE
  if (sessionCookie) {
    const dir = path.dirname(STORAGE_STATE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: sessionCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ])

    await page.goto("/", { waitUntil: "load" })
    await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 15000 })
    await page.context().storageState({ path: STORAGE_STATE })
    return
  }

  // ── Mode 2: Credentials token-mode (backend JWT) ─────────────────────────
  let accessToken: string = process.env.PLAYWRIGHT_TOKEN ?? ""

  if (!accessToken) {
    throw new Error(
      "\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      " PLAYWRIGHT AUTH: No credentials found.\n\n" +
      " Option A — Paste session cookie from DevTools:\n" +
      "   PLAYWRIGHT_SESSION_COOKIE=<next-auth.session-token value>\n\n" +
      " Option B — Paste backend JWT from /api/auth/session:\n" +
      "   PLAYWRIGHT_TOKEN=<accessToken value>\n\n" +
      " Both go in .env (Playwright reads .env, not .env.local)\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    )
  }

  await page.goto("/login", { waitUntil: "load" })

  if (!page.url().includes("/login")) {
    await page.context().storageState({ path: STORAGE_STATE })
    return
  }

  const csrfToken: string = await page.evaluate(async () => {
    const res = await fetch("/api/auth/csrf")
    const data = (await res.json()) as { csrfToken: string }
    return data.csrfToken
  })

  const result: { ok: boolean; status: number } = await page.evaluate(
    async ({ csrfToken, accessToken, user }) => {
      const body = new URLSearchParams({
        csrfToken,
        mode: "token",
        token: accessToken,
        user: JSON.stringify(user),
        callbackUrl: "/",
        json: "true",
      })
      const r = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "follow",
      })
      return { ok: r.ok, status: r.status }
    },
    { csrfToken, accessToken, user: TEST_USER }
  )

  if (!result.ok && result.status !== 302) {
    throw new Error(`Auth callback failed: HTTP ${result.status}`)
  }

  await page.goto("/", { waitUntil: "load" })
  await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 15000 })
  await page.context().storageState({ path: STORAGE_STATE })
})
