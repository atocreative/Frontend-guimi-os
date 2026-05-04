# 🏗️ ARQUITETURA VISUAL - Guimicell OS Frontend

## 📊 Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          👤 USUÁRIO FINAL                                  │
│                                                                             │
│  Acessa em http://localhost:3000 com navegador                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🌐 NEXT.JS FRONTEND (Next.js 16)                       │
│                  http://localhost:3000                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🎨 PAGE ROUTES (App Router)                                         │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ ✅ (auth)/login/page.tsx         ← Login page (public)              │  │
│  │ ✅ (dashboard)/page.tsx           ← Main dashboard (protected)      │  │
│  │ ✅ (dashboard)/agenda/page.tsx    ← Task management                 │  │
│  │ ✅ (dashboard)/colaboradores/... ← Team management                 │  │
│  │ ✅ (dashboard)/comercial/...     ← Sales pipeline                  │  │
│  │ ✅ (dashboard)/financeiro/...    ← Financial dashboard             │  │
│  │ ✅ (dashboard)/indicadores/...   ← KPI/Performance                │  │
│  │ ✅ (dashboard)/configuracoes/... ← Settings (ADMIN only)           │  │
│  │ ✅ (dashboard)/operacao/...      ← Operations/Checklists          │  │
│  │ ✅ (dashboard)/processos/...     ← Process checklists             │  │
│  │ ✅ (dashboard)/suporte/...       ← Support/Help                   │  │
│  │ ✅ (dashboard)/dashboard-dev/... ← Developer menu (feature flags) │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🔐 AUTHENTICATION & SESSION                                         │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ NextAuth v5 (JWT Strategy)                                          │  │
│  │ ├─ auth.ts: NextAuth config                                         │  │
│  │ ├─ Session storage: HTTP-only cookie                                │  │
│  │ ├─ JWT Token: From backend /api/auth/token                          │  │
│  │ ├─ Callbacks: Redirect logic, role checking                         │  │
│  │ └─ Token expiry handler: Shows modal, triggers re-login             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🎛️ COMPONENTS LAYER                                                 │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ React Components (19.2.4)                                            │  │
│  │ ├─ components/dashboard/*      ← Dashboard components              │  │
│  │ ├─ components/agenda/*         ← Task components                   │  │
│  │ ├─ components/colaboradores/*  ← Team components                  │  │
│  │ ├─ components/layout/*         ← Header, sidebar, footer           │  │
│  │ ├─ components/ui/*             ← Reusable UI (shadcn/ui)           │  │
│  │ └─ components/dialogs/*        ← Modals, confirmations            │  │
│  │                                                                      │  │
│  │ State Management: Zustand (if needed)                              │  │
│  │ Forms: React Hook Form + Zod validation                            │  │
│  │ Styling: Tailwind CSS 4 + Radix UI                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🎣 HOOKS & CONTEXT                                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Custom Hooks:                                                       │  │
│  │ ├─ useFeatureFlags()           ← Access feature flags              │  │
│  │ ├─ use-menu-visibility.ts      ← Menu state management             │  │
│  │ ├─ use-gamificacao-feedback.ts ← Gamification feedback             │  │
│  │ └─ use-mobile.ts               ← Responsive detection              │  │
│  │                                                                      │  │
│  │ Context Providers:                                                  │  │
│  │ ├─ confirm-dialog-context      ← Confirmation dialogs              │  │
│  │ ├─ feature-flag-context        ← Feature flag state                │  │
│  │ └─ NextAuth SessionProvider    ← Auth session                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              🎯 SERVICE LAYER (lib/services/backend-service.ts)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HIGH-LEVEL BUSINESS LOGIC                                                 │
│                                                                             │
│ backendService.getTasks()        → Get all tasks with filters           │
│ backendService.createTask(data)  → Validate + create task               │
│ backendService.updateTask()      → Update with validation               │
│ backendService.deleteTask()      → Delete + cascade cleanup             │
│ backendService.getUsers()        → Get all users                        │
│ backendService.getChecklists()   → Get checklists                      │
│ backendService.getDashboard()    → Fetch dashboard data                 │
│                                                                             │
│ Throws: BackendServiceError (with business context)                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│          📊 REPOSITORY LAYER (lib/repositories/backend-repository.ts)      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ DATA ACCESS ABSTRACTION                                                   │
│                                                                             │
│ getTasks()              → api.fetch("/api/tasks")                        │
│ getTaskById(id)         → api.fetch("/api/tasks/:id")                    │
│ createTask(data)        → api.fetch("/api/tasks", POST)                  │
│ updateTask(id, data)    → api.fetch("/api/tasks/:id", PUT)               │
│ deleteTask(id)          → api.fetch("/api/tasks/:id", DELETE)            │
│                                                                             │
│ getUsers()              → api.fetch("/api/users")                        │
│ getChecklists()         → api.fetch("/api/checklists")                   │
│                                                                             │
│ Throws: ApiError (with status code + raw data)                           │
│                                                                             │
│ SPECIALIZED REPOSITORIES:                                                │
│ ├─ indicadores-repository.ts                                             │
│ │  └─ Combines backend users + Fone Ninja sales data                    │
│ ├─ backend-financeiro.ts                                                 │
│ │  └─ Financial metrics from Fone Ninja                                  │
│ └─ gamification-repository.ts                                            │
│    └─ Gamification data access                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              ⚙️ API CLIENT LAYER (lib/api-client.ts)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ LOW-LEVEL HTTP COMMUNICATION                                             │
│                                                                             │
│ async fetch(url, options)   ← HTTP wrapper with error handling           │
│ async getAuthToken()        ← Get/refresh JWT from backend               │
│ setTokenExpirationHandler() ← Callback when token expires               │
│                                                                             │
│ Features:                                                                 │
│ ├─ JWT token caching (valid until expiry - 5min buffer)                 │
│ ├─ Automatic token refresh from /api/auth/token                         │
│ ├─ Bearer token injection in Authorization header                        │
│ ├─ Response parsing (JSON or plain text)                                │
│ ├─ Error handling (status + data extraction)                            │
│ ├─ HTTP-only cookie support (NextAuth session)                          │
│ └─ Expiration callback (triggers modal, prevents crashes)                │
│                                                                             │
│ Throws: ApiError (status, data, message, code)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────┐
        │     🌐 HTTP REQUESTS (Fetch API)             │
        │                                               │
        │ GET /api/tasks                               │
        │ GET /api/tasks/:id                           │
        │ POST /api/tasks                              │
        │ PUT /api/tasks/:id                           │
        │ DELETE /api/tasks/:id                        │
        │                                               │
        │ GET /api/users                               │
        │ POST /api/users                              │
        │ PUT /api/users/:id                           │
        │ DELETE /api/users/:id                        │
        │                                               │
        │ GET /api/checklists                          │
        │ PATCH /api/checklists/:id/items/:itemId      │
        │                                               │
        │ GET /api/auth/token                          │
        │ GET /api/dashboard                           │
        │ GET /api/dev-menu                            │
        │ PATCH /api/dev-menu/:featureId               │
        │                                               │
        │ Header: Authorization: Bearer <JWT_TOKEN>    │
        │ Header: Content-Type: application/json       │
        └───────────────────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
      ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   BACKEND API   │ │  FONE NINJA API  │ │  KOMMO CRM API   │
│ (Express.js)    │ │ (External)       │ │ (External)       │
├─────────────────┤ ├──────────────────┤ ├──────────────────┤
│                 │ │                  │ │                  │
│ localhost:3001  │ │ api.fone.ninja   │ │ kommo.com/api   │
│                 │ │                  │ │                  │
│ Routes:         │ │ Features:        │ │ Features:        │
│ ├─ /api/tasks   │ │ ├─ Sales data    │ │ ├─ Leads         │
│ ├─ /api/users   │ │ ├─ Revenue       │ │ ├─ Pipeline      │
│ ├─ /api/...     │ │ ├─ Costs         │ │ └─ Integration   │
│ └─ ...          │ │ └─ Profit        │ │    (Planned)     │
│                 │ │                  │ │                  │
└─────────────────┘ └──────────────────┘ └──────────────────┘
      │                  │
      ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│         🗄️ DATABASE (PostgreSQL + Prisma)              │
│                                                         │
│ Tables:                                               │
│ ├─ User (id, email, name, role, ...)                 │
│ ├─ Task (id, title, priority, status, ...)           │
│ ├─ Checklist (id, name, type, ...)                   │
│ ├─ ChecklistItem (id, description, completed, ...)   │
│ ├─ MenuFeature (featureId, enabled, ...)             │
│ ├─ Gamification (userId, points, badges, ...)        │
│ └─ ... (other tables)                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 FLUXO DE UMA REQUISIÇÃO COMPLETA

### Exemplo Real: Usuário clica em "Criar Tarefa"

```
1. COMPONENT (ModalNovaTarefa)
   └─ User fills form: title, priority, due date, assignee
   └─ Clicks "Criar"
   └─ onSubmit() called

2. FORM VALIDATION (Zod Schema)
   └─ Validates: title required, date format, priority enum
   └─ If invalid: Show error toast
   └─ If valid: Continue

3. SERVICE CALL (from component)
   └─ await backendService.createTask({
   │    title: "Nova tarefa",
   │    priority: "ALTA",
   │    dueAt: "2026-05-10T10:00:00Z",
   │    assigneeId: "user-123"
   │  })

4. SERVICE LAYER (backend-service.ts)
   └─ Validates business logic
   └─ if (!data.title) throw new BackendServiceError(...)
   └─ await backendRepository.createTask(data)

5. REPOSITORY LAYER (backend-repository.ts)
   └─ await api.fetch("/api/tasks", {
   │    method: "POST",
   │    body: JSON.stringify(data),
   │    auth: "required"
   │  })

6. API CLIENT (api-client.ts)
   └─ token = await getAuthToken()
   │  (checks cache, if expired fetches from /api/auth/token)
   └─ Response = fetch(url, {
   │    method: "POST",
   │    headers: {
   │      "Authorization": "Bearer " + token,
   │      "Content-Type": "application/json"
   │    },
   │    body: JSON.stringify(data)
   │  })
   └─ data = await parseResponse(Response)
   └─ if (!Response.ok) throw new ApiError(...)
   └─ return data

7. BACKEND (Express.js)
   └─ Receive POST /api/tasks
   └─ Verify JWT token in Authorization header
   └─ Extract user from token
   └─ Validate data in body
   └─ Insert into database
   └─ Return { id, title, priority, ... }

8. BACK TO COMPONENT
   └─ task = { id: "task-456", title: "Nova tarefa", ... }
   └─ Close modal
   └─ Update task list (refetch or optimistic update)
   └─ Show success toast: "Tarefa criada!"

9. USER SEES
   └─ Modal closes
   └─ Green toast: "✅ Tarefa criada com sucesso!"
   └─ New task appears in list
```

---

## 🔗 CONEXÕES ENTRE CAMADAS

```
┌────────────────────────────────────────────────────────────────┐
│ DEPENDENCY FLOW                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Components      (UI, event handlers, user interaction)        │
│      │                                                          │
│      ├──> Services (useFeatureFlags, hooks)                    │
│      │       │                                                  │
│      │       └──> ONLY Service Layer (NEVER API Client)        │
│      │            └──> Repository Layer                        │
│      │                 └──> API Client                         │
│      │                      └──> HTTP                          │
│      │                           └──> Backend                  │
│      │                                                          │
│      └──> Context (NextAuth, Theme, Dialog)                    │
│           └──> Providers in app/providers.tsx                  │
│                                                                │
│ ❌ NEVER ALLOWED:                                              │
│ • Components importing from api-client.ts                      │
│ • Components importing from repositories                       │
│ • Repositories calling Services                                │
│ • Services calling Components                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 COMPONENT HIERARCHY

```
RootLayout (app/layout.tsx)
├── SessionProvider (NextAuth)
├── ThemeProvider (next-themes)
├── ConfirmDialogProvider
├── FeatureFlagProvider
│
└── (auth) Group
│   ├── LoginPage
│   │   └── LoginForm
│   │       ├── Input (email)
│   │       └── Input (password)
│
└── (dashboard) Group ← Protected by middleware
    ├── DashboardLayout
    │   ├── AppSidebar
    │   │   ├── NavItem (dashboard)
    │   │   ├── NavItem (agenda)
    │   │   ├── NavItem (colaboradores)
    │   │   └── ...
    │   │
    │   ├── Header
    │   │   ├── UserMenu
    │   │   └── NotificationBell
    │   │
    │   ├── Footer
    │   │
    │   └── Page Content (dynamic)
    │
    ├── DashboardPage
    │   ├── DashboardAdmin (if admin/gestor)
    │   │   ├── KPICard (revenue)
    │   │   ├── KPICard (expenses)
    │   │   ├── KPICard (margin)
    │   │   ├── FinancialChart
    │   │   ├── TaskSummary
    │   │   └── TopPerformers
    │   │
    │   └── DashboardColaborador (if colaborador)
    │       ├── MyTasksCard
    │       ├── CompletionRate
    │       └── Achievements
    │
    ├── AgendaPage
    │   ├── ResumoTime
    │   ├── FiltroUsuario
    │   ├── TarefasGrid (kanban view)
    │   │   └── ColunaPessoa
    │   │       └── TarefaCard
    │   │
    │   ├── ChecklistsGrid
    │   │   ├── ChecklistCard (abertura)
    │   │   └── ChecklistCard (fechamento)
    │   │
    │   └── ModalNovaTarefa
    │
    ├── ColaboradoresPage
    │   ├── UsuarioCard[]
    │   │   └── Edit/Delete buttons
    │   │
    │   ├── NovoColaboradorModal
    │   └── EditarUsuarioModal
    │
    ├── ComercialPage
    │   ├── PipelineBoard
    │   └── SalesChart
    │
    ├── FinanceiroPage
    │   ├── KPICard (revenue)
    │   ├── FinancialChart
    │   └── MarginAnalysis
    │
    ├── IndicadoresPage
    │   ├── Leaderboard
    │   └── EvolutionChart
    │
    ├── ConfiguracoesPage
    │   ├── UserManagement
    │   │   └── UsuarioCard[]
    │   ├── IntegrationStatus
    │   └── SystemSettings
    │
    ├── OperacaoPage
    │   └── ChecklistsGrid
    │
    └── DashboardDevelopmentPage
        ├── FeatureFlagsList
        │   └── FeatureFlagItem[] (toggle)
        │
        └── MenuVisibilityControl
            └── MenuConfigItem[] (role-based)
```

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│ READING DATA (GET)                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Component renders (useEffect, or async server component)          │
│     │                                                               │
│     ├─ Show loading skeleton                                       │
│     │                                                               │
│     └─ Call: await backendService.getTasks()                       │
│           │                                                         │
│           ├─ backendRepository.getTasks()                          │
│           │     │                                                   │
│           │     └─ api.fetch("/api/tasks", { auth: "required" })   │
│           │           │                                             │
│           │           ├─ GET /api/tasks                            │
│           │           │  Headers: Authorization: Bearer ...        │
│           │           │                                             │
│           │           └─ Response: { tasks: [...] }                │
│           │                                                         │
│           └─ return { tasks: [...] }                               │
│                                                                     │
│     ├─ Hide skeleton                                               │
│     ├─ Display: task list, kanban, etc.                            │
│                                                                     │
│     └─ On error:                                                   │
│         ├─ Show error toast                                        │
│         ├─ Log error to console                                    │
│         └─ Display fallback UI (empty state, retry button)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ WRITING DATA (POST/PUT/DELETE)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. User interaction (submit form, click delete, etc.)              │
│                                                                     │
│ 2. Validate (Zod schema)                                           │
│    ├─ If invalid: toast error, stop                               │
│    └─ If valid: continue                                          │
│                                                                     │
│ 3. Optimistic update (optional)                                    │
│    └─ Immediately update UI (assume success)                       │
│                                                                     │
│ 4. Service call: await backendService.createTask(data)             │
│    │                                                               │
│    ├─ backendRepository.createTask(data)                           │
│    │     │                                                         │
│    │     └─ api.fetch("/api/tasks", {                             │
│    │         method: "POST",                                       │
│    │         body: JSON.stringify(data),                           │
│    │         auth: "required"                                      │
│    │       })                                                       │
│    │           │                                                   │
│    │           └─ POST /api/tasks                                  │
│    │              Response: { id, title, ... } (new task)          │
│    │                                                               │
│    └─ return new task                                              │
│                                                                     │
│ 5. On success:                                                      │
│    ├─ Invalidate cache (refetch list, or update optimistic)       │
│    ├─ Show success toast                                           │
│    ├─ Close modal/dialog                                           │
│    └─ Redirect (if needed)                                         │
│                                                                     │
│ 6. On error:                                                        │
│    ├─ Revert optimistic update (if any)                            │
│    ├─ Show error toast with message                                │
│    └─ User can retry                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│ LOGIN FLOW                                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. User accesses http://localhost:3000                          │
│    └─ No session → Redirect to /login                           │
│                                                                  │
│ 2. User fills form: email + password                            │
│    └─ Clicks "Entrar"                                           │
│                                                                  │
│ 3. LoginForm submits form                                       │
│    └─ await signIn("credentials", { email, password })          │
│        └─ NextAuth redirects to /api/auth/signin                │
│                                                                  │
│ 4. NextAuth Callback                                            │
│    └─ Call authorize() callback in auth.ts                      │
│        └─ POST to Backend /api/auth/login                       │
│           └─ Backend validates credentials in DB                │
│           └─ Backend returns JWT token                          │
│                                                                  │
│ 5. Session Creation                                             │
│    └─ Store JWT in NextAuth session                             │
│    └─ Set HTTP-only cookie (secure, httpOnly, sameSite)         │
│    └─ Session object: { user: { id, email, role }, token }      │
│                                                                  │
│ 6. Redirect                                                      │
│    └─ redirect("/dashboard")                                    │
│                                                                  │
│ 7. Dashboard Loads                                              │
│    └─ Check session with getSession()                           │
│    └─ Extract token from session                                │
│    └─ Use token for all API calls                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TOKEN REFRESH FLOW                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ When making API call:                                           │
│                                                                  │
│ 1. api-client.ts getAuthToken()                                 │
│    ├─ Check cached token                                        │
│    │  ├─ If valid (not expired) → Use cached                   │
│    │  └─ If expired → Fetch new                                 │
│    │                                                             │
│    └─ Fetch new token from /api/auth/token                      │
│       └─ Backend generates new JWT from session                 │
│       └─ Return { token: "eyJ..." }                             │
│                                                                  │
│ 2. Cache token with expiry                                      │
│    └─ Calculate expiry - 5min buffer                            │
│    └─ Store in _cachedToken variable                            │
│                                                                  │
│ 3. Use token in request                                         │
│    └─ fetch(url, {                                              │
│      │   headers: {                                             │
│      │     Authorization: `Bearer ${token}`                     │
│      │   }                                                       │
│      │ })                                                        │
│                                                                  │
│ 4. If 401 (Unauthorized):                                       │
│    ├─ Clear token cache                                         │
│    ├─ Call tokenExpirationHandler() callback                    │
│    │  └─ Shows "Sessão expirada" modal                          │
│    │  └─ User clicks "Fazer login novamente"                    │
│    │  └─ Redirects to /login                                    │
│    └─ Don't throw error (prevent cascade failures)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ SESSION EXPIRATION HANDLING                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Component mounts (in providers.tsx)                          │
│    └─ setTokenExpirationHandler(() => {                         │
│        └─ Show modal: "Sua sessão expirou"                     │
│        └─ Offer two buttons:                                    │
│           ├─ "Fazer login novamente" → redirect("/login")       │
│           └─ "Fechar" → dismiss modal                           │
│       })                                                         │
│                                                                  │
│ 2. When token request returns 401:                              │
│    └─ tokenExpirationHandler() is called                        │
│    └─ Modal appears over current page                           │
│    └─ User can't interact with page                             │
│                                                                  │
│ 3. User clicks "Fazer login novamente"                          │
│    └─ await signOut({ callbackUrl: "/login" })                  │
│    └─ Clears NextAuth session                                   │
│    └─ Redirects to /login                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ FEATURE FLAG SYSTEM

```
┌──────────────────────────────────────────────────────────────────┐
│ FEATURE FLAGS (Developer Menu)                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Define Features (lib/feature-definitions.ts)                 │
│                                                                  │
│    export const FEATURE_DEFINITIONS = [                         │
│      { featureId: "DASHBOARD", id: "dashboard", ... },          │
│      { featureId: "AGENDA", id: "agenda", ... },                │
│      { featureId: "COLABORADORES", id: "colaboradores", ... },  │
│      ... (all features)                                          │
│    ]                                                             │
│                                                                  │
│ 2. Backend Stores State                                         │
│                                                                  │
│    Table: MenuFeature                                           │
│    Columns:                                                      │
│    ├─ featureId: string (DASHBOARD, AGENDA, etc.)             │
│    ├─ enabled: boolean                                          │
│    ├─ pending: boolean (show "em breve" instead of disable)    │
│    ├─ allowedRoles: Role[] (ADMIN, GESTOR, COLABORADOR)        │
│    └─ updatedAt: timestamp                                      │
│                                                                  │
│ 3. Frontend Fetches (app/dashboard/dashboard-development)      │
│                                                                  │
│    GET /api/dev-menu                                            │
│    └─ Response: [                                               │
│       {                                                          │
│         featureId: "DASHBOARD",                                 │
│         enabled: true,                                          │
│         pending: false,                                         │
│         allowedRoles: ["ADMIN", "GESTOR"]                       │
│       },                                                         │
│       ... (all features)                                        │
│      ]                                                           │
│                                                                  │
│ 4. Display in UI                                                │
│                                                                  │
│    For each feature:                                            │
│    ├─ Show toggle (ON/OFF)                                      │
│    ├─ Show status:                                              │
│    │  ├─ ✅ Ativo (enabled: true, pending: false)              │
│    │  ├─ ⏳ Em breve (pending: true)                           │
│    │  └─ ❌ Desativado (enabled: false)                        │
│    └─ Show allowed roles                                        │
│                                                                  │
│ 5. User Changes Feature                                         │
│                                                                  │
│    ├─ Select feature from list                                  │
│    ├─ Click toggle ON/OFF                                       │
│    ├─ Optionally change allowed roles                           │
│    ├─ ⚠️ MISSING: Save button (TODO)                           │
│    └─ Should PATCH /api/dev-menu/:featureId                     │
│       Body: {                                                   │
│         enabled: true/false,                                    │
│         pending: true/false,                                    │
│         allowedRoles: ["ADMIN"]                                 │
│       }                                                          │
│                                                                  │
│ 6. Frontend Uses Flag (in component)                            │
│                                                                  │
│    const { isEnabled } = useFeatureFlags()                      │
│    const agendaEnabled = isEnabled("AGENDA")                    │
│                                                                  │
│    if (!agendaEnabled) {                                        │
│      return <DisabledFeature name="Agenda" />                   │
│    }                                                             │
│                                                                  │
│    return <AgendaComponent />                                   │
│                                                                  │
│ 7. Sidebar Hides/Shows Menu Items                               │
│                                                                  │
│    SidebarNav items:                                            │
│    ├─ Map over FEATURE_DEFINITIONS                             │
│    ├─ Check isEnabled() for each                               │
│    ├─ Render NavItem only if enabled                           │
│    │  (or gray out if pending)                                 │
│    └─ Check allowedRoles                                        │
│       └─ Hide if user role not in allowedRoles                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔀 PAGE PROTECTION & ROLE-BASED ACCESS

```
┌──────────────────────────────────────────────────────────────────┐
│ ROUTE PROTECTION                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ (dashboard) Layout                                               │
│ ├─ Check session exists                                         │
│ │  ├─ If NO session → redirect("/login")                       │
│ │  └─ If YES → continue                                         │
│ │                                                                │
│ └─ Each page checks role:                                        │
│                                                                  │
│    Pages accessible to EVERYONE:                                │
│    ├─ / (dashboard)                                             │
│    ├─ /agenda                                                   │
│    ├─ /colaboradores                                            │
│    ├─ /indicadores                                              │
│    └─ /comercial (if enabled)                                   │
│                                                                  │
│    Pages ADMIN/GESTOR ONLY:                                     │
│    ├─ /configuracoes (ADMIN, GESTOR)                            │
│    ├─ /dashboard-development (ADMIN)                            │
│    └─ /operacao (ADMIN, GESTOR)                                 │
│                                                                  │
│    If COLABORADOR tries to access /configuracoes:               │
│    └─ Redirect to /access-denied                                │
│                                                                  │
│    If SUPER_USER tries to access /configuracoes:                │
│    └─ 🔴 BUG: Currently blocked (should have access)           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ROLE HIERARCHY                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ADMIN (Full Access)                                              │
│ ├─ All features enabled                                         │
│ ├─ Can manage users                                             │
│ ├─ Can manage features                                          │
│ └─ See all data                                                 │
│                                                                  │
│ GESTOR (Manager Access)                                          │
│ ├─ Most features enabled                                        │
│ ├─ Can manage COLABORADOR users                                 │
│ ├─ Cannot manage other GESTORs or ADMINs                        │
│ └─ Cannot access /dashboard-development                         │
│                                                                  │
│ COLABORADOR (Limited Access)                                     │
│ ├─ Can see own tasks only                                       │
│ ├─ Cannot manage users                                          │
│ ├─ Cannot access /configuracoes                                 │
│ └─ Cannot access /dashboard-development                         │
│                                                                  │
│ SUPER_USER (Special)                                             │
│ ├─ Full access (like ADMIN)                                     │
│ ├─ Additional: /dashboard-development                           │
│ └─ 🔴 BUG: Should access /configuracoes (blocked now)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 KEY FILES & THEIR PURPOSE

```
┌──────────────────────────────────────────────────────────────────┐
│ ENTRY POINTS & CONFIGURATION                                     │
├──────────────────────────────────────────────────────────────────┤
│ auth.ts                    ← NextAuth config, JWT, callbacks      │
│ app/layout.tsx             ← Root layout, providers              │
│ app/providers.tsx          ← SessionProvider, theme, contexts    │
│ next.config.js             ← Next.js config                      │
│ tailwind.config.ts         ← Tailwind CSS config                 │
│ tsconfig.json              ← TypeScript config                   │
│ package.json               ← Dependencies, scripts               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PAGES (App Router)                                               │
├──────────────────────────────────────────────────────────────────┤
│ app/(auth)/login/page.tsx  ← Login page                          │
│ app/(dashboard)/page.tsx   ← Main dashboard                      │
│ app/(dashboard)/agenda/page.tsx    ← Task management             │
│ app/(dashboard)/colaboradores/*    ← Team management             │
│ app/(dashboard)/financeiro/*       ← Finance                     │
│ app/(dashboard)/indicadores/*      ← KPIs                        │
│ app/(dashboard)/configuracoes/*    ← Settings                    │
│ app/(dashboard)/dashboard-dev/*    ← Developer menu              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC (Service Layer)                                   │
├──────────────────────────────────────────────────────────────────┤
│ lib/services/backend-service.ts    ← Main service                │
│ lib/services/gamification-service  ← Gamification logic          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DATA ACCESS (Repository Layer)                                   │
├──────────────────────────────────────────────────────────────────┤
│ lib/repositories/backend-repository.ts  ← Main repository         │
│ lib/repositories/gamification-repository.ts                       │
│ lib/indicadores-repository.ts           ← Indicators (KPI)        │
│ lib/backend-financeiro.ts               ← Finance + Fone Ninja   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ API COMMUNICATION (API Client Layer)                             │
├──────────────────────────────────────────────────────────────────┤
│ lib/api-client.ts              ← HTTP fetch wrapper              │
│ lib/backend-api.ts             ← Backend integration              │
│ lib/server-api-client.ts       ← Server-side calls               │
│ lib/foneninja.ts               ← Fone Ninja integration          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ UTILITIES & HELPERS                                              │
├──────────────────────────────────────────────────────────────────┤
│ lib/tarefas.ts                 ← Task sorting, filtering          │
│ lib/task-utils.ts              ← More task helpers                │
│ lib/feature-flags.ts           ← Feature flag logic               │
│ lib/feature-definitions.ts     ← Feature list                     │
│ lib/menu-config-context.ts     ← Menu state                       │
│ lib/route-protection.ts        ← Role checking                    │
│ lib/auth-session.ts            ← Session retrieval                │
│ lib/errors.ts                  ← Custom errors                    │
│ lib/utils.ts                   ← General utilities                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TYPES                                                            │
├──────────────────────────────────────────────────────────────────┤
│ types/tarefas.ts              ← Task types                        │
│ types/usuarios.ts             ← User types                        │
│ types/dashboard.ts            ← Dashboard types                   │
│ types/financeiro.ts           ← Finance types                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TESTS                                                            │
├──────────────────────────────────────────────────────────────────┤
│ tests/unit/task-utils.test.ts       ← Unit tests                 │
│ tests/unit/backend-service.test.ts  ← Service tests              │
│ tests/e2e/login.spec.ts             ← E2E tests                  │
│ tests/e2e/dashboard.spec.ts         ← Dashboard tests            │
│ tests/e2e/agenda.spec.ts            ← Task tests                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ SUMMARY CHECKLIST

```
ARQUITETURA
□ Camadas bem definidas (components → service → repo → api)
□ Separação de responsabilidades clara
□ TypeScript para type safety
□ Error handling em todas as camadas

DADOS
□ Dados reais do backend (PostgreSQL)
□ Integração Fone Ninja para financeiro
□ Fallback/empty states se API falhar
□ Caching estratégico de tokens

AUTENTICAÇÃO
□ JWT-based com NextAuth
□ Session HTTP-only cookies
□ Token refresh automático
□ Session expiration modal

ROLE-BASED ACCESS
□ ADMIN - Acesso total
□ GESTOR - Acesso gerencial
□ COLABORADOR - Acesso pessoal
□ SUPER_USER - Acesso especial (com bugs)

FEATURE FLAGS
□ Features configuráveis via developer menu
□ Backend persiste estado
□ Frontend respeita configuração
□ ⚠️ Falta: Save button, per-role visibility

TELAS
□ Dashboard - KPIs, tarefas, top performers
□ Agenda - Kanban, checklists
□ Colaboradores - Team management
□ Financeiro - Revenue, expenses, charts
□ Indicadores - Leaderboard, KPIs
□ Configurações - Settings (ADMIN)
□ Developer Menu - Feature flags (ADMIN)
```

---

**Gerado em:** 2026-05-03  
**Arquitetura:** Next.js 16 + React 19 + TypeScript  
**Estado:** Production-ready com alguns bugs conhecidos
