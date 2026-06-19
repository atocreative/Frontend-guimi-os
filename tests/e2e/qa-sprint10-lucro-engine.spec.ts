/**
 * QA Sprint 10 — Lucro Engine + UX Cleanup validation
 *
 * Covers:
 *   1. Dashboard: removed KPIs gone, new KPIs present
 *   2. Financeiro: FN-first rule, no "Indisponível" amber banner
 *   3. Processos: SUPER_USER gate enforced
 *   4. Insights: component visible in financeiro
 *   5. MA fallback: UI shows FN data when MA absent
 */

import { test, expect, Page } from "@playwright/test"

// Global timeout — login + networkidle on polling app needs headroom
test.setTimeout(60000)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// storageState from auth.setup.ts injects the session — no login needed per-test.

const ADMIN_EMAIL = "admin@guimicell.com"

