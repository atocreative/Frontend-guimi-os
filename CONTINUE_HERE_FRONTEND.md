---
created: 2026-05-12
version: v3.2
next_task: Dashboard by Profile
deadline: 2026-05-14
---

# CONTINUE_HERE_FRONTEND.md

**Resume here for next session. Do NOT read PROJECT_STATE_FRONTEND.md**

---

## CURRENT STATE (Snapshot 2026-05-12)

✅ **JUST COMPLETED** (This Session):
- Financeiro module fully functional (ADMIN-only RBAC protection)
- 8 KPIs with monthly/daily separation working correctly
- Gráficos dinâmicos (month/year in titles)
- Tables: TabelaDespesas + TabelaEntradas side-by-side
- PostgreSQL source badges + sync status
- Build: passing
- 2 commits: RBAC+Sync, Tabelas Completas

✅ **ALREADY WORKING**:
- Dashboard KPIs monthly vs daily (fetchMensal/fetchDiario separated)
- Integration status polling (5 min)
- Manual sync trigger
- Auth + NextAuth + JWT
- Feature flags with role requirements
- Menu RBAC visibility
- Logout clears session
- Responsive UI (Tailwind)
- All gráficos from Recharts

❌ **NOT STARTED**:
- Comercial (feature flag disabled)
- Operação (feature flag disabled)
- Ranking expansion (only Leaderboard basic exists)
- Dashboard by profile
- Processos

---

## NEXT IMMEDIATE TASK (Priority 1)

### DASHBOARD BY PROFILE

**What to build:**
Separate dashboard layouts based on user role (SUPER_USER, ADMIN, GERENTE, COLABORADOR)

**Where:**
- `app/(dashboard)/page.tsx` (selector logic)
- New components: `components/dashboard/dashboard-admin.tsx` (already exists, refactor), `dashboard-gerente.tsx`, `dashboard-colaborador.tsx` (NEW)
- `lib/get-dashboard-for-role.ts` (NEW utility)

**Behavior:**
- **SUPER_USER**: Dashboard admin (current)
- **ADMIN**: Dashboard admin (current)
- **GERENTE**: Subset of KPIs (faturamento, vendas, despesas, metas, team stats)
- **COLABORADOR**: Minimal view (apenas tarefas, seu desempenho, targets pessoais)

**Implementation approach:**
1. Create role-specific component for each dashboard type
2. Import appropriate component in `page.tsx` based on `session.user.role`
3. Reuse existing KPI cards, gráficos, tabelas
4. NO new architecture - just conditional rendering
5. Use existing `useSyncStatus`, `useIntegrationStatus` hooks

**Files to create/modify:**
- NEW: `components/dashboard/dashboard-gerente.tsx`
- NEW: `components/dashboard/dashboard-colaborador.tsx`
- MODIFY: `app/(dashboard)/page.tsx` (add selector logic)
- MODIFY: `lib/feature-flags.ts` (adjust if needed for visibility)

**Estimated effort:** 3-4 hours (component building + testing)

**Build dependency:** None - should pass `npm run build`

---

## WHAT NOT TO CHANGE

❌ **DO NOT TOUCH:**
- Monthly/daily separation logic (dashboard-admin.tsx fetchMensal/fetchDiario)
- Feature flags RBAC (already correct)
- Integration polling logic (5 minute interval working)
- Financeiro module (just shipped, stable)
- Auth flow (NextAuth working)
- Gráfico implementations (Recharts)

❌ **DO NOT REFACTOR:**
- Dashboard-admin.tsx (complex state, working correctly)
- Route protection logic
- Polling hooks

---

## BLOCKERS / KNOWN ISSUES

✅ **No critical blockers**
- All APIs responding correctly
- Build state stable
- Data sources confirmed (PostgreSQL-backed)

⚠️ **Minor issues** (not blockers):
- Some feature flags disabled (Comercial, Operação, Processos) - menu items still visible
- Resolution: Can disable menu items or enable features later (not urgent)

---

## TESTING CHECKLIST (After Dashboard by Profile)

- [ ] SUPER_USER login → sees admin dashboard
- [ ] ADMIN login → sees admin dashboard
- [ ] GERENTE login → sees gerente dashboard with subset KPIs
- [ ] COLABORADOR login → sees minimal dashboard with tasks
- [ ] Role-specific data visible (no cross-role data leakage)
- [ ] Filters work in each dashboard
- [ ] Gráficos render correctly in each layout
- [ ] Sync badges show in all dashboards
- [ ] Mobile responsive (all breakpoints)
- [ ] Build passes: `npm run build`

---

## GIT STATUS (Starting Point)

Last commits (2026-05-12):
```
feat(financeiro): complete module with tables and comparatives
feat(financeiro): implement RBAC protection and sync status badges
```

Branch: `main`
Uncommitted changes: None (everything committed)

---

## QUICK REFERENCE

**Key Services** (DO NOT create new ones):
- `getDashboardSummary({ year, month, day? })` → `/api/dashboard/summary`
- `getIntegrationStatus()` → `/api/integrations/status`
- `syncFoneNinja()` → `POST /api/integrations/foneninja/sync`

**Key Hooks** (DO NOT create new ones):
- `useIntegrationStatus(pollInterval)` → 5 min polling
- `useSyncStatus()` → manual trigger + state
- `useGameificacaoFeedback()` → task notifications

**Key Components**:
- `KpiCard` → reuse for all dashboards
- `GraficoFinanceiro`, `GraficoFluxoCaixa`, `GraficoCategorias` → reuse
- `TabelaDespesas`, `TabelaEntradas` → reuse from Financeiro

**RBAC**:
- Feature flags: `lib/feature-flags.ts`
- Route protection: `lib/route-protection.ts` → `protectPage()`
- Session role: `session.user.role` (ADMIN, GERENTE, COLABORADOR, SUPER_USER)

---

## DEBUG TIPS

If something breaks:
1. Check `npm run build` first (catches TypeScript issues)
2. Check console for hydration warnings (should be zero)
3. Check Network tab for 404s on API calls
4. Verify session role in Application → Cookies
5. Check feature flags in `lib/feature-flags.ts`

---

## NEXT PRIORITIES (After Dashboard by Profile)

1. ✅ Dashboard by Profile (THIS)
2. Ranking: Expand top 3 + points + levels
3. Comercial: Enable feature flag + Kommo integration
4. Full RBAC audit
5. Meu Assessor (if backend ready)

---

**Last Session**: 2026-05-12
**Session Duration**: ~1.5h (FAST EXECUTION MODE)
**Modules Completed**: Financeiro (full)
**Build Status**: ✅ PASSING
**Ready to Resume**: YES
