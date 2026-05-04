# 📊 Guimicell OS - Análise Completa do Projeto Frontend

**Data da Análise:** 2026-05-03  
**Versão:** 1.0  
**Descrição:** Documentação completa da arquitetura, estrutura de arquivos, fluxo de dados e integração backend do sistema

---

## 🎯 O QUE É O PROJETO

**Guimicell OS** é um **dashboard operacional interno** construído para a empresa Guimicell. É uma aplicação web moderna que centraliza:

- 📈 **Métricas financeiras em tempo real** (faturamento, receitas, despesas)
- ✅ **Gestão de tarefas e agenda** para a equipe
- 👥 **Gestão de colaboradores** e acompanhamento de desempenho
- 💼 **Gestão comercial** (vendas, pipeline de leads)
- 📊 **Indicadores e KPIs** de desempenho individual e de equipe
- ⚙️ **Configurações do sistema** e gerenciamento de usuários
- 🎮 **Gamificação** (leaderboards, badges, reconhecimento)
- 🔧 **Painel de desenvolvedor** com feature flags e menu customizável

### Propósito Principal
Servir como **hub centralizado de operações** onde líderes e gestores podem:
1. Acompanhar saúde financeira em tempo real
2. Gerenciar tarefas da equipe
3. Monitorar KPIs e metas
4. Controlar quem acessa o quê
5. Ativar/desativar features dinamicamente

---

## 🛠️ STACK DE TECNOLOGIAS

### Frontend
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Next.js** | 16.2.2 | Framework React com SSR/SSG |
| **React** | 19.2.4 | Biblioteca UI |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 4 | Estilização utilitária |
| **Radix UI** | 1.4.3 | Componentes acessíveis |
| **shadcn/ui** | 4.1.2 | Componentes React pré-built |
| **Zustand** | 5.0.12 | State management (cliente) |

### Autenticação
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **NextAuth** | 5.0.0-beta.30 | Autenticação JWT |
| **bcryptjs** | 3.0.3 | Hash de senhas |

### Formulários & Validação
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **React Hook Form** | 7.72.1 | Gerenciamento de formulários |
| **@hookform/resolvers** | 5.2.2 | Validação com Zod |
| **Zod** | 4.3.6 | Validação de esquemas TypeScript |

### Dados & Tabelas
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **TanStack Table** | 8.21.3 | Tabelas avançadas |
| **@dnd-kit** | 6.3.1+ | Drag and drop |
| **Prisma** | 7.6.0 | ORM (usado no backend) |
| **@prisma/client** | 7.6.0 | Cliente Prisma |

### Dados Visuais
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Recharts** | 3.8.0 | Gráficos e charts |
| **date-fns** | 4.1.0 | Manipulação de datas |

### Icons & UI
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Lucide React** | 1.7.0 | Ícones SVG |
| **next-themes** | 0.4.6 | Dark mode |
| **sonner** | 2.0.7 | Toast notifications |
| **vaul** | 1.1.2 | Drawer/Modal |
| **class-variance-authority** | 0.7.1 | CSS-in-JS utilities |
| **clsx** | 2.1.1 | Conditional CSS |
| **tailwind-merge** | 3.5.0 | Merge Tailwind classes |

### Banco de Dados
| Tecnologia | Propósito |
|-----------|----------|
| **PostgreSQL** | Database principal (backend) |
| **@prisma/adapter-pg** | Adapter PostgreSQL |
| **pg** | Cliente PostgreSQL direto |

### Testes
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Jest** | 29.7.0 | Testes unitários |
| **@testing-library/react** | 15.0.0 | Testes de componentes |
| **@playwright/test** | 1.45.0 | Testes E2E |

### Desenvolvimento
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **ESLint** | 9 | Linting |
| **TypeScript** | 5 | Type checking |

---

## 🏗️ ARQUITETURA GERAL

### Fluxo de Dados
```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js Client)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Components (React)                                    │  │
│  │ ├─ Dashboard (Admin/Collab views)                   │  │
│  │ ├─ Agenda (Task management)                         │  │
│  │ ├─ Colaboradores (Team management)                  │  │
│  │ ├─ Indicadores (KPI/Performance)                    │  │
│  │ ├─ Financeiro (Finance dashboard)                   │  │
│  │ └─ Configurações (Settings)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service Layer (lib/services/)                        │  │
│  │ └─ backendService.ts (Business logic)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Repository Layer (lib/repositories/)                 │  │
│  │ └─ backend-repository.ts (Data access)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Client (lib/api-client.ts)                       │  │
│  │ ├─ HTTP communication                                │  │
│  │ ├─ JWT token management                              │  │
│  │ └─ Error handling                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ BACKEND API (Express.js)       │
        │ http://localhost:3001          │
        ├────────────────────────────────┤
        │ Endpoints:                     │
        │ ├─ /api/tasks                  │
        │ ├─ /api/users                  │
        │ ├─ /api/checklists             │
        │ ├─ /api/financial              │
        │ └─ /api/dev-menu               │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ PostgreSQL Database            │
        │                                │
        │ Tables:                        │
        │ ├─ User                        │
        │ ├─ Task (Tarefa)               │
        │ ├─ Checklist (Item)            │
        │ ├─ MenuFeature                 │
        │ ├─ Gamification                │
        │ └─ ...                         │
        └────────────────────────────────┘
                         
        ┌────────────────────────────────┐
        │ EXTERNAL APIS                  │
        │                                │
        │ ├─ Fone Ninja                  │
        │ │  (Sales data, store metrics) │
        │ │  https://api.fone.ninja      │
        │ │                              │
        │ ├─ Kommo CRM                   │
        │ │  (Leads, pipeline)           │
        │ │  https://kommo.com/api       │
        │ │                              │
        │ └─ (Optional integrations)     │
        └────────────────────────────────┘
```

### Padrão de Arquitetura

O projeto segue a **camada de serviços** para separação de responsabilidades:

1. **Components Layer** - UI/UX (React components)
2. **Service Layer** - Lógica de negócio (`lib/services/`)
3. **Repository Layer** - Acesso a dados (`lib/repositories/`)
4. **API Client** - Comunicação HTTP (`lib/api-client.ts`)

**Regra importante:** Components **NUNCA** devem importar diretamente de `api-client.ts`. Sempre usar a camada de serviço.

---

## 📁 ESTRUTURA DE ARQUIVOS COMPLETA

### Raiz do Projeto
```
frontend-guimi-os/
├── .env.example                    # Variáveis de ambiente de exemplo
├── .env.local                      # Variáveis locais (gitignored)
├── .next/                          # Build artifacts (Next.js)
├── .claude/                        # Claude Code settings
├── .serena/                        # Serena tools cache
├── .planning/                      # GSD planning files
│
├── app/                            # 📍 MAIN: Next.js App Router
│   ├── layout.tsx                  # Root layout (footer, theme)
│   ├── providers.tsx               # NextAuth + Context providers
│   │
│   ├── (auth)/                     # 🔐 Auth routes (public)
│   │   ├── layout.tsx              # Auth layout
│   │   └── login/
│   │       └── page.tsx            # Login page (email + password)
│   │
│   ├── (dashboard)/                # 🛡️ Protected dashboard routes
│   │   ├── layout.tsx              # Dashboard layout (sidebar, nav)
│   │   ├── page.tsx                # Main dashboard (KPIs + tasks)
│   │   ├── loading.tsx             # Suspense loading state
│   │   │
│   │   ├── access-denied/
│   │   │   └── page.tsx            # 403 page for insufficient permissions
│   │   │
│   │   ├── agenda/                 # 📋 Task management
│   │   │   ├── page.tsx            # Tasks grid, kanban, checklists
│   │   │   └── loading.tsx         # Loading skeleton
│   │   │
│   │   ├── colaboradores/          # 👥 Team management
│   │   │   ├── page.tsx            # Team members, performance
│   │   │   └── loading.tsx
│   │   │
│   │   ├── comercial/              # 💼 Sales management
│   │   │   └── page.tsx            # Sales pipeline, leads
│   │   │
│   │   ├── financeiro/             # 💰 Finance dashboard
│   │   │   └── page.tsx            # Revenue, expenses, margins
│   │   │
│   │   ├── indicadores/            # 📈 Performance KPIs
│   │   │   └── page.tsx            # Team indicators, leaderboard
│   │   │
│   │   ├── configuracoes/          # ⚙️ Settings
│   │   │   ├── page.tsx            # User settings, system config
│   │   │   └── loading.tsx
│   │   │
│   │   ├── operacao/               # 🔄 Operations
│   │   │   └── page.tsx            # Operational processes
│   │   │
│   │   ├── processos/              # 📝 Checklists
│   │   │   └── page.tsx            # Store opening/closing lists
│   │   │
│   │   ├── suporte/                # 🆘 Support
│   │   │   └── page.tsx            # Help and support center
│   │   │
│   │   ├── dashboard-development/  # 👨‍💻 Developer tools
│   │   │   └── page.tsx            # Feature flags, dev menu
│   │   │
│   │   └── data/
│   │       └── mock.ts             # Mock data for development
│   │
│   ├── api/                        # 🔌 Backend API routes (proxy/helpers)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts        # NextAuth handler
│   │   │
│   │   ├── checklist/
│   │   │   └── route.ts            # Checklist endpoints
│   │   │
│   │   ├── tarefas/
│   │   │   └── route.ts            # Task endpoints
│   │   │
│   │   └── dev-menu/
│   │       └── route.ts            # Feature flags endpoints
│   │
│   ├── privacidade/
│   │   └── page.tsx                # Privacy policy
│   │
│   └── termos/
│       └── page.tsx                # Terms of service
│
├── components/                     # 🎨 React Components
│   ├── ui/                         # Reusable UI components (shadcn)
│   │   ├── button.tsx              # Button component
│   │   ├── card.tsx                # Card component
│   │   ├── input.tsx               # Input fields
│   │   ├── select.tsx              # Select/dropdown
│   │   ├── dialog.tsx              # Modal/dialog
│   │   ├── sidebar.tsx             # Sidebar navigation
│   │   ├── skeleton.tsx            # Loading skeleton
│   │   ├── table.tsx               # Data table
│   │   ├── badge.tsx               # Badge/tag
│   │   ├── avatar.tsx              # User avatar
│   │   └── ...                     # Other primitives
│   │
│   ├── layout/                     # 🏗️ Layout components
│   │   ├── app-sidebar.tsx         # Main navigation sidebar
│   │   ├── header.tsx              # Top header with user menu
│   │   ├── footer.tsx              # Footer
│   │   └── navbar.tsx              # Top navigation bar
│   │
│   ├── dashboard/                  # 📊 Dashboard components
│   │   ├── dashboard-admin.tsx     # Admin view (full metrics)
│   │   ├── dashboard-colaborador.tsx # Team member view (personal tasks)
│   │   ├── kpi-card.tsx            # KPI display card
│   │   ├── financial-snapshot.tsx  # Financial overview
│   │   ├── task-summary.tsx        # Task overview
│   │   └── top-performers.tsx      # Leaderboard
│   │
│   ├── agenda/                     # 📋 Task management components
│   │   ├── modal-nova-tarefa.tsx   # Create new task modal
│   │   ├── tarefa-card.tsx         # Individual task card
│   │   ├── resumo-time.tsx         # Team summary
│   │   ├── filtro-usuario.tsx      # User filter
│   │   ├── coluna-pessoa.tsx       # Person column (kanban)
│   │   └── task-list.tsx           # Task list view
│   │
│   ├── colaboradores/              # 👥 Team components
│   │   ├── usuario-card.tsx        # Team member card
│   │   ├── novo-colaborador-modal.tsx # Add team member
│   │   ├── editar-usuario-modal.tsx   # Edit team member
│   │   ├── usuario-list.tsx        # Team list
│   │   └── performance-metrics.tsx # Individual metrics
│   │
│   ├── comercial/                  # 💼 Sales components
│   │   ├── pipeline-board.tsx      # Sales pipeline kanban
│   │   ├── lead-card.tsx           # Lead card
│   │   └── sales-chart.tsx         # Sales metrics
│   │
│   ├── financeiro/                 # 💰 Finance components
│   │   ├── revenue-card.tsx        # Revenue display
│   │   ├── expense-card.tsx        # Expense display
│   │   ├── financial-chart.tsx     # Financial trends
│   │   └── margin-analysis.tsx     # Profit margin
│   │
│   ├── indicadores/                # 📈 Performance indicators
│   │   ├── leaderboard.tsx         # Team ranking
│   │   ├── metric-card.tsx         # Single metric
│   │   ├── evolution-chart.tsx     # Historical data
│   │   └── medal-badge.tsx         # Achievement badges
│   │
│   ├── configuracoes/              # ⚙️ Settings components
│   │   ├── usuario-card.tsx        # User settings card
│   │   ├── editar-usuario-modal.tsx   # Edit user settings
│   │   ├── integrations-panel.tsx  # External integrations
│   │   └── system-settings.tsx     # System-wide settings
│   │
│   ├── operacao/                   # 🔄 Operations
│   │   └── checklist-card.tsx      # Daily checklists
│   │
│   ├── super-usuario/              # 👨‍💻 Developer menu
│   │   ├── developer-menu-enhanced.tsx # Feature flags UI
│   │   ├── feature-flag-item.tsx   # Individual flag toggle
│   │   └── menu-visibility-control.tsx # Menu visibility settings
│   │
│   ├── gamificacao/                # 🎮 Gamification
│   │   ├── leaderboard.tsx         # Team rankings
│   │   ├── achievement-badge.tsx   # Achievement display
│   │   └── rewards-panel.tsx       # Rewards and badges
│   │
│   ├── dialogs/                    # 💬 Dialog components
│   │   ├── confirm-dialog.tsx      # Confirmation dialog
│   │   └── session-modal.tsx       # Session expired modal
│   │
│   ├── auth/                       # 🔐 Auth components
│   │   ├── login-form.tsx          # Login form
│   │   └── mfa-form.tsx            # MFA form (if enabled)
│   │
│   ├── usuarios/                   # 👤 User components
│   │   ├── novo-colaborador-modal.tsx # Add new user
│   │   └── usuario-card.tsx        # User card
│   │
│   ├── support/                    # 🆘 Support components
│   │   ├── faq-list.tsx            # FAQ list
│   │   └── contact-form.tsx        # Support form
│   │
│   ├── theme-toggle.tsx            # Dark/light mode toggle
│   └── ...                         # Other components
│
├── lib/                            # 📚 Utilities & Services
│   ├── api-client.ts               # ⚠️ HTTP client (LOW-LEVEL)
│   │   ├─ fetch wrapper
│   │   ├─ JWT token management
│   │   ├─ Error handling
│   │   └─ Used by: Repository layer only
│   │
│   ├── backend-api.ts              # Backend integration
│   │   ├─ Direct backend fetch functions
│   │   ├─ Data extraction/parsing
│   │   └─ Used by: Services
│   │
│   ├── backend-financeiro.ts       # Finance-specific API
│   │   ├─ Financial metrics (revenue, expenses)
│   │   ├─ Fone Ninja integration
│   │   └─ Used by: Dashboard, Financeiro components
│   │
│   ├── services/                   # 🎯 SERVICE LAYER (HIGH-LEVEL)
│   │   ├── backend-service.ts      # Main business logic
│   │   │   ├─ getTasks()
│   │   │   ├─ getTaskById()
│   │   │   ├─ createTask()
│   │   │   ├─ updateTask()
│   │   │   ├─ deleteTask()
│   │   │   ├─ getChecklists()
│   │   │   ├─ getUsers()
│   │   │   ├─ getDashboard()
│   │   │   └─ ... (all business operations)
│   │   │
│   │   └── gamification-service.ts # Gamification logic
│   │       ├─ calculateAchievements()
│   │       ├─ updateLeaderboard()
│   │       └─ trackPerformance()
│   │
│   ├── repositories/               # 📊 REPOSITORY LAYER (DATA ACCESS)
│   │   ├── backend-repository.ts   # Main repository
│   │   │   ├─ getTasks()
│   │   │   ├─ createTask()
│   │   │   ├─ updateTask()
│   │   │   ├─ getUsers()
│   │   │   └─ ... (direct API calls)
│   │   │
│   │   └── gamification-repository.ts # Gamification data access
│   │       └─ fetchGamificationData()
│   │
│   ├── indicadores-repository.ts   # Performance metrics
│   │   ├─ getIndicadoresTime()     # Team KPIs + Fone Ninja sales
│   │   └─ getEvolucaoIndicadores() # Historical metrics
│   │
│   ├── foneninja.ts                # 🔗 Fone Ninja integration
│   │   ├─ getToken()               # Authentication
│   │   ├─ getVendasPorVendedor()   # Sales by seller
│   │   ├─ getVendasDetalhadas()    # Detailed sales
│   │   └─ getLucroMensal()         # Monthly profit
│   │
│   ├── feature-flags.ts            # Feature flag logic
│   │   ├─ getFeatureFlagStatus()   # Check feature status
│   │   └─ toggleFeatureFlag()      # Enable/disable
│   │
│   ├── feature-definitions.ts      # Feature flag definitions
│   │   └─ FEATURE_DEFINITIONS[]    # All features
│   │
│   ├── feature-flag-manager.ts     # Feature management
│   │   └─ persistMenuConfig()      # Save menu state
│   │
│   ├── feature-flag-provider.ts    # React context provider
│   │   └─ FeatureProvider wrapper
│   │
│   ├── menu-config-context.ts      # Menu configuration state
│   │   ├─ MenuConfigItem interface
│   │   └─ menuConfigContext
│   │
│   ├── tarefas.ts                  # Task utilities
│   │   ├─ sortTarefasByPriority()
│   │   ├─ isTaskDueToday()
│   │   └─ filterTarefasByStatus()
│   │
│   ├── task-utils.ts               # More task helpers
│   │   ├─ getTaskPriority()
│   │   └─ formatTaskDate()
│   │
│   ├── server-api-client.ts        # Server-side API calls
│   │   └─ Used in: Server components, SSR
│   │
│   ├── auth-session.ts             # Session management
│   │   └─ getSession()             # Get current session
│   │
│   ├── prisma.ts                   # Prisma client
│   │   └─ prisma instance
│   │
│   ├── route-protection.ts         # Role-based access
│   │   ├─ requireRole()
│   │   └─ checkPermission()
│   │
│   ├── integration-checker.ts      # Integration validation
│   │   └─ validateBackendConnection()
│   │
│   ├── errors.ts                   # Custom error classes
│   │   ├─ ApiError
│   │   └─ ServiceError
│   │
│   ├── utils.ts                    # General utilities
│   │   ├─ formatCurrency()
│   │   ├─ formatDate()
│   │   └─ parseJSON()
│   │
│   └── schemas/                    # Zod validation schemas
│       ├── tarefas.ts              # Task validation
│       ├── usuarios.ts             # User validation
│       └── ...                     # Other schemas
│
├── hooks/                          # 🎣 React Hooks
│   ├── useFeatureFlags.ts          # Access feature flags in components
│   ├── use-menu-visibility.ts      # Menu configuration hooks
│   ├── use-gamificacao-feedback.ts # Gamification feedback
│   └── use-mobile.ts               # Mobile detection
│
├── context/                        # 🔗 React Context
│   ├── confirm-dialog-context.tsx  # Confirmation dialog state
│   ├── feature-flag-context.tsx    # Feature flags context
│   └── auth-context.tsx            # Auth state (if used)
│
├── types/                          # 📝 TypeScript Types
│   ├── tarefas.ts                  # Task types
│   │   ├─ TarefaDB
│   │   ├─ NovaChecklist
│   │   ├─ ChecklistDB
│   │   └─ ItemChecklist
│   │
│   ├── usuarios.ts                 # User types
│   │   ├─ UsuarioDB
│   │   ├─ UsuarioSimples
│   │   └─ UserRole
│   │
│   ├── dashboard.ts                # Dashboard types
│   │   ├─ DashboardResponse
│   │   ├─ KPIData
│   │   └─ FinancialMetrics
│   │
│   ├── financeiro.ts               # Finance types
│   │   ├─ VendaRow
│   │   ├─ FinancialSnapshot
│   │   └─ ExpenseData
│   │
│   └── ...                         # Other types
│
├── public/                         # 🖼️ Static assets
│   ├── favicon.ico                 # Browser tab icon
│   ├── logo.svg                    # Company logo
│   ├── bg.jpg                      # Background images
│   ├── cell.png                    # Graphics
│   └── ...                         # Other assets
│
├── tests/                          # 🧪 Test files
│   ├── unit/                       # Jest unit tests
│   │   ├── task-utils.test.ts      # Task utility tests
│   │   ├── backend-service.test.ts # Service layer tests
│   │   └── ...                     # Other unit tests
│   │
│   └── e2e/                        # Playwright E2E tests
│       ├── login.spec.ts           # Login flow
│       ├── dashboard.spec.ts       # Dashboard rendering
│       ├── agenda.spec.ts          # Task management
│       ├── colaboradores.spec.ts   # Team management
│       ├── configuracoes.spec.ts   # Settings and access control
│       └── ...                     # Other E2E tests
│
├── playwright/                     # 🎭 Playwright config
│   └── fixtures/                   # Test fixtures
│
├── prisma/                         # 🗄️ Database (Backend)
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Database seeding
│
├── auth.ts                         # NextAuth configuration
│   ├─ JWT strategy
│   ├─ Session management
│   └─ Callback handlers
│
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies & scripts
├── package-lock.json               # Lock file
├── jest.config.js                  # Jest configuration
├── playwright.config.ts            # Playwright configuration
│
└── .env.local                      # ⚠️ Local environment (gitignored)
```

---

## 🔌 CAMADAS DE DADOS E COMO FUNCIONAM

### 1️⃣ **API CLIENT** (`lib/api-client.ts`) - Nível Mais Baixo
Responsabilidade: Comunicação HTTP pura

**O que faz:**
- Wrapper `fetch()` com headers e tratamento de erros
- Gerenciamento de JWT token
- Retry automático com refresh de token
- Parsing de respostas JSON
- Lançamento de `ApiError` em falhas

**Métodos principais:**
```typescript
async fetch(url: string, options?: FetchOptions): Promise<Response>
async getAuthToken(): Promise<string | null>
function setTokenExpirationHandler(handler: () => void): void
```

**Usado por:** Repository layer apenas ❌ Components NUNCA devem usar

**Exemplo de erro tratado:**
```typescript
// Se o token expirar, o handler é acionado
// Em vez de lançar erro diretamente
```

---

### 2️⃣ **REPOSITORY LAYER** (`lib/repositories/backend-repository.ts`) - Nível Médio
Responsabilidade: Acesso a dados abstraindo o backend

**O que faz:**
- Chama `api-client` para buscar dados
- Extrai/transforma dados da resposta
- Trata erros específicos do backend
- Retorna dados tipados

**Métodos principais:**
```typescript
getTasks(): Promise<{ tasks: TarefaDB[] }>
getTaskById(id: string): Promise<TarefaDB>
createTask(data: CreateTaskData): Promise<TarefaDB>
updateTask(id: string, data: UpdateTaskData): Promise<TarefaDB>
deleteTask(id: string): Promise<void>
getUsers(): Promise<{ users: UsuarioDB[] }>
getChecklists(): Promise<{ checklists: ChecklistDB[] }>
```

**Usado por:** Service layer ❌ Components NUNCA devem usar

---

### 3️⃣ **SERVICE LAYER** (`lib/services/backend-service.ts`) - Nível Mais Alto
Responsabilidade: Lógica de negócio e orquestração

**O que faz:**
- Chama repository para dados
- Implementa validações de negócio
- Combina múltiplas fontes de dados
- Trata e enriquece erros com contexto
- Lança `BackendServiceError` com mensagens de negócio

**Métodos principais:**
```typescript
async getTasks(): Promise<{ tasks: TarefaDB[] }>
async createTask(data: CreateTaskData): Promise<TarefaDB>
async updateTask(id: string, data: UpdateTaskData): Promise<TarefaDB>
async deleteTask(id: string): Promise<void>
async getUsers(): Promise<{ users: UsuarioDB[] }>
async getDashboard(): Promise<DashboardResponse>
async getChecklists(): Promise<{ checklists: ChecklistDB[] }>
```

**Usado por:** ✅ Components, Server components, Hooks

**Exemplo de uso correto em component:**
```typescript
// ✅ CERTO - Usar service layer
import { backendService } from "@/lib/services/backend-service"

const tasks = await backendService.getTasks()

// ❌ ERRADO - Chamar API client diretamente
import { api } from "@/lib/api-client"
const tasks = await api.fetch("/tasks")  // NÃO!
```

---

### 4️⃣ **SPECIALIZED REPOSITORIES**
Repositórios específicos para domínios particulares:

**`indicadores-repository.ts`** - Performance metrics
- `getIndicadoresTime()` - Busca KPIs da equipe (combina backend + Fone Ninja)
- `getEvolucaoIndicadores()` - Dados históricos

**`backend-financeiro.ts`** - Finance data
- `getSnapshotFinanceiroServer()` - Dashboard financeiro
- `getDashboardDataServer()` - Dados gerais do dashboard
- `getVendasPorVendedor()` - Sales by seller (Fone Ninja)

**`gamification-repository.ts`** - Gamification
- Fetch achievements, medals, leaderboard data

---

## 🔄 FLUXO DE UMA REQUISIÇÃO REAL

### Exemplo: Carregar tarefas na página Agenda

```
1. COMPONENT (agenda/page.tsx)
   └─ useEffect(() => { loadTasks() })
   
2. SERVICE CALL
   └─ const tasks = await backendService.getTasks()
   
3. SERVICE LAYER (backend-service.ts)
   └─ return await backendRepository.getTasks()
   
4. REPOSITORY (backend-repository.ts)
   └─ const response = await api.fetch("/api/tasks", { auth: "required" })
   └─ return extractTasksPayload(response)
   
5. API CLIENT (api-client.ts)
   └─ const token = await getAuthToken()
   └─ const response = await fetch(url, { 
   │    headers: { Authorization: `Bearer ${token}` }
   │  })
   └─ return parseResponse(response)
   
6. HTTP REQUEST
   └─ GET http://localhost:3001/api/tasks
   └─ Header: Authorization: Bearer eyJ...
   
7. BACKEND (Express.js)
   └─ Verifica JWT token
   └─ Busca tarefas no banco de dados
   └─ Retorna JSON com tarefas
   
8. BACK TO COMPONENT
   └─ tasks = [ { id, title, priority, ... }, ... ]
   └─ Renderiza lista de tarefas
```

---

## 📡 ENDPOINTS DO BACKEND USADOS

### Autenticação
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/auth/token` | GET | Obter novo token JWT | Cookie session |
| `/api/auth/login` | POST | Login com email/password | None |

### Tarefas (Agenda)
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/tasks` | GET | Listar todas as tarefas | Bearer token |
| `/api/tasks/:id` | GET | Obter tarefa específica | Bearer token |
| `/api/tasks` | POST | Criar nova tarefa | Bearer token |
| `/api/tasks/:id` | PUT/PATCH | Atualizar tarefa | Bearer token |
| `/api/tasks/:id` | DELETE | Deletar tarefa | Bearer token |

### Usuários (Colaboradores)
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/users` | GET | Listar todos os usuários | Bearer token |
| `/api/users/:id` | GET | Obter usuário específico | Bearer token |
| `/api/users` | POST | Criar novo usuário | Bearer token (ADMIN) |
| `/api/users/:id` | PUT/PATCH | Atualizar usuário | Bearer token |
| `/api/users/:id` | DELETE | Deletar usuário | Bearer token (ADMIN) |

### Checklists (Operação)
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/checklists` | GET | Listar checklists | Bearer token |
| `/api/checklists/:id` | GET | Obter checklist | Bearer token |
| `/api/checklists` | POST | Criar checklist | Bearer token |
| `/api/checklists/:id/items/:itemId` | PATCH | Toggle item | Bearer token |

### Dashboard
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/dashboard` | GET | Dashboard data (KPIs, summary) | Bearer token |

### Features (Developer Menu)
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/dev-menu` | GET | Listar menu features | Bearer token (ADMIN) |
| `/api/dev-menu/:featureId` | PATCH | Atualizar feature | Bearer token (ADMIN) |

### Financeiro (via `backend-financeiro.ts`)
| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/api/financial/snapshot` | GET | Snapshot financeiro | Bearer token |
| `/api/financial/revenue` | GET | Receitas por período | Bearer token |
| `/api/financial/expenses` | GET | Despesas por período | Bearer token |

---

## 🔗 INTEGRAÇÕES EXTERNAS

### 1. **Fone Ninja** - Sistema de Vendas
**URL:** `https://api.fone.ninja`  
**Responsável:** `lib/foneninja.ts`  
**Autenticação:** Email + Password (env vars)  
**O que busca:**
- Vendas por vendedor
- Faturamento mensal
- Dados de estoque
- Lucro por venda

**Endpoints Fone Ninja:**
```
POST  /auth/api/login              # Autenticação
GET   /erp/api/lojas/{loja}/...   # Dados de venda
```

**Variáveis de Ambiente:**
```env
FONENINJA_BASE_URL=https://api.fone.ninja
FONENINJA_EMAIL=seu-email@fone.ninja
FONENINJA_PASSWORD=sua-senha
FONENINJA_LOJA_ID=guimicell
FONENINJA_TOKEN=jwt-token-opcional
```

**Usado para:**
- Indicadores → Team performance (sales data)
- Dashboard → Financial metrics
- Comercial → Sales pipeline (se implementado)

### 2. **Kommo CRM** - Gestão de Clientes (Planejado)
**URL:** `https://kommo.com/api`  
**Status:** Mencionado mas não totalmente integrado  
**Propósito:**
- Leads e pipeline
- Integração com agenda de tarefas

**Variáveis de Ambiente (quando implementado):**
```env
KOMMO_API_KEY=sua-chave-api
KOMMO_ACCOUNT_ID=sua-conta
```

### 3. **NextAuth.js** - Autenticação
**Versão:** 5.0.0-beta.30  
**Tipo:** JWT-based authentication  
**Arquivo:** `auth.ts`  

**Fluxo:**
1. Usuário faz login com email/password
2. Backend (Express) valida credentials
3. Backend retorna JWT token
4. NextAuth armazena em sessão HTTP-only cookie
5. Cada requisição usa o token

---

## 📊 O QUE CADA TELA EXIBE

### 1. 🏠 **Dashboard** - Visão Geral Operacional

**Rota:** `/` ou `/dashboard`  
**Arquivo:** `app/(dashboard)/page.tsx`  
**Componentes:** 
- `DashboardAdmin` (para ADMIN/GESTOR)
- `DashboardColaborador` (para COLABORADOR)

#### Para Admin/Gestor
| Seção | O que mostra | API/Source |
|-------|-------------|-----------|
| **KPI Cards** | Faturamento do mês, Receita total, Margem, Metas | `backend-financeiro.ts` |
| **Financial Chart** | Gráfico de receita últimos 6 meses + tendência semanal | Fone Ninja |
| **Tasks Due Today** | Top 5 tarefas com vencimento hoje | `/api/tasks` |
| **Pending Tasks** | Tarefas pendentes/EM_ANDAMENTO | `/api/tasks` |
| **Top Performers** | Leaderboard dos 3 melhores | `indicadores-repository.ts` |
| **Recent Activity** | Últimas ações do sistema | Dashboard API |

#### Para Colaborador
| Seção | O que mostra | API/Source |
|-------|-------------|-----------|
| **My Tasks Today** | Tarefas atribuídas a mim com vencimento hoje | `/api/tasks` (filtrado) |
| **Pending Tasks** | Minhas tarefas pendentes | `/api/tasks` (filtrado) |
| **Completion Rate** | % de tarefas completadas este mês | Cálculo local |
| **Achievements** | Badges/medalhas conquistadas | Gamification |

**Dados Reais vs Mock:**
- ✅ Reais: Tarefas, usuários, KPIs financeiros (se backend responde)
- ⚠️ Fallback: Se API falhar, mostra "—" ou mensagens de erro

**Status da Conexão:**
```typescript
// Se tiver erro, dashboard não "quebra", apenas mostra vazio
const { data, response } = await backendFetch("/api/tasks")
if (!response.ok) {
  // Use dados vazios, não lance erro
  return { tasks: [], total: 0 }
}
```

---

### 2. 📋 **Agenda** - Gestão de Tarefas

**Rota:** `/agenda`  
**Arquivo:** `app/(dashboard)/agenda/page.tsx`  
**Componentes:**
- `TarefasGrid` - Vista Kanban por pessoa
- `ChecklistsGrid` - Checklists de abertura/fechamento
- `ModalNovaTarefa` - Criar nova tarefa

#### O que mostra

| Visualização | Descrição | API |
|---|---|---|
| **Kanban Board** | Colunas por pessoa, cartões por tarefa | `/api/tasks` |
| **Filtro Usuário** | Dropdown para filtrar por pessoa | `/api/users` |
| **Tarefa Card** | Título, prioridade, data vencimento, status | `/api/tasks` |
| **Daily Checklists** | Abertura da loja / Fechamento da loja | `/api/checklists` |
| **Task Modals** | Criar, editar, deletar tarefas | `/api/tasks` POST/PUT/DELETE |

**Prioridades:**
- 🔴 ALTA (vermelho)
- 🟡 MÉDIA (amarelo)
- 🟢 BAIXA (verde)

**Status:**
- PENDENTE
- EM_ANDAMENTO
- CONCLUÍDO
- CANCELADO

**Dados:**
- ✅ Todas as tarefas vêm do backend (`/api/tasks`)
- ✅ Checklists do backend (`/api/checklists`)
- ✅ Usuários do backend (`/api/users`)
- ❌ Sem dados mockados

---

### 3. 👥 **Colaboradores** - Gestão de Equipe

**Rota:** `/colaboradores`  
**Arquivo:** `app/(dashboard)/colaboradores/page.tsx`  
**Componentes:**
- `UsuarioCard` - Card de cada membro
- `NovoColaboradorModal` - Adicionar novo
- `EditarUsuarioModal` - Editar existente

#### O que mostra

| Item | Descrição | API |
|---|---|---|
| **User List** | Todos os usuários (exceto super-admin) | `/api/users` |
| **User Card** | Avatar, nome, role, email, status | `/api/users` |
| **Performance Metrics** | Tarefas completas, taxa conclusão | `/api/users/:id/metrics` |
| **Add/Edit User** | Modal para criar ou editar usuário | `/api/users` POST/PUT |
| **Delete User** | Botão para deletar (ADMIN) | `/api/users/:id` DELETE |

**Roles Exibidos:**
- ADMIN - Acesso total
- GESTOR - Gerenciamento limitado
- COLABORADOR - Sem acesso admin

**Access Control:**
- Super user não deve aparecer na lista
- ADMIN pode editar todos
- GESTOR pode editar COLABORADOR
- COLABORADOR vê apenas si mesmo

---

### 4. 💼 **Comercial** - Pipeline de Vendas

**Rota:** `/comercial`  
**Arquivo:** `app/(dashboard)/comercial/page.tsx`  
**Status:** Página criada, componentes em desenvolvimento

#### O que deveria mostrar (Planejado)

| Item | Descrição | API |
|---|---|---|
| **Sales Pipeline** | Kanban: Novo → Qualificado → Negociação → Fechado | Kommo CRM |
| **Leads List** | Lista de leads com status | Kommo CRM |
| **Lead Details** | Contato, empresa, valor, probabilidade | Kommo CRM |
| **Sales Forecast** | Projeção de vendas | Cálculo local |

**Dados:**
- ⚠️ Parcialmente implementado
- Precisa de integração com Kommo CRM

---

### 5. 💰 **Financeiro** - Dashboard Financeiro

**Rota:** `/financeiro`  
**Arquivo:** `app/(dashboard)/financeiro/page.tsx`  
**Componentes:**
- `RevenueCard` - Receita
- `ExpenseCard` - Despesas
- `FinancialChart` - Gráficos
- `MarginAnalysis` - Análise de margem

#### O que mostra

| Métrica | Descrição | Fonte |
|---|---|---|
| **Faturamento Mês** | Total de receita do mês | Fone Ninja |
| **Despesas Mês** | Total de despesas do mês | Backend |
| **Margem Líquida** | (Receita - Despesa) | Cálculo |
| **Ticket Médio** | Receita / Nº transações | Fone Ninja |
| **Gráfico 6 Meses** | Evolução de receita | Fone Ninja histórico |
| **Gráfico Semanal** | Receita por semana | Fone Ninja |
| **Comparativo YTD** | Acumulado vs ano anterior | Backend |

**Dados:**
- ✅ Reais: Vêm de Fone Ninja (backend-financeiro.ts)
- ⚠️ Se Fone Ninja falhar, mostra "—"

---

### 6. 📈 **Indicadores** - KPIs e Desempenho

**Rota:** `/indicadores`  
**Arquivo:** `app/(dashboard)/indicadores/page.tsx`  
**Componentes:**
- `Leaderboard` - Ranking de vendas
- `MetricCard` - Cards de métrica individual
- `EvolutionChart` - Gráfico histórico

#### O que mostra

| Métrica | Descrição | Fonte |
|---|---|---|
| **Leaderboard** | Ranking por faturamento mês | Fone Ninja + Backend |
| **Vendas/Pessoa** | Total vendido por vendedor | Fone Ninja |
| **Faturamento/Pessoa** | Receita atribuída | Fone Ninja |
| **Ticket Médio** | Venda média | Fone Ninja |
| **Taxa Conversão** | % leads→clientes | Kommo (não impl.) |
| **Leads Ativos** | Nº de leads em aberto | Kommo (não impl.) |
| **Meta Progress** | % da meta atingida | Cálculo |
| **Badges/Medalhas** | Achievements conquistadas | Gamification |

**Dados:**
- ✅ Fone Ninja: Vendas, faturamento, ranking
- ❌ Kommo: Ainda não integrado
- ⚠️ Falback: Se API falhar, 0 ou "--"

---

### 7. ⚙️ **Configurações** - System Settings

**Rota:** `/configuracoes`  
**Arquivo:** `app/(dashboard)/configuracoes/page.tsx`  
**Acesso:** ADMIN e GESTOR apenas

#### O que mostra

| Seção | Descrição | O que pode fazer |
|---|---|---|
| **User Management** | Lista de usuários | ADMIN: Edit/Delete all<br>GESTOR: Edit COLABORADOR |
| **Profile Settings** | Dados do usuário logado | Edit profile, change password |
| **Integrations** | Status das integrações | View Fone Ninja, Kommo |
| **System Settings** | Configurações globais | ADMIN: Edit all |
| **Backup & Export** | Dados do sistema | ADMIN: Export data |

**Dados:**
- ✅ Reais: Usuários, configurações do backend
- ❌ Não há dados mockados

**Access Control:**
- Super user: DEVE ter acesso (atualmente bug)
- ADMIN: Acesso total
- GESTOR: Acesso limitado
- COLABORADOR: Redirecionado para home

---

### 8. 🔄 **Operação** - Processos Operacionais

**Rota:** `/operacao`  
**Arquivo:** `app/(dashboard)/operacao/page.tsx`  
**Componentes:**
- `ChecklistCard` - Checklist display

#### O que mostra

| Item | Descrição | API |
|---|---|---|
| **Daily Checklists** | Abertura/Fechamento da loja | `/api/checklists` |
| **Checklist Items** | Items individuais com toggle | `/api/checklists/:id/items` |
| **Completion Status** | % completo | Cálculo local |

---

### 9. 📝 **Processos** - Checklists

**Rota:** `/processos`  
**Arquivo:** `app/(dashboard)/processos/page.tsx`  
**Similar:** Praticamente idêntico a /operacao

---

### 10. 🆘 **Suporte** - Help & Support

**Rota:** `/suporte`  
**Arquivo:** `app/(dashboard)/suporte/page.tsx`  
**Componentes:**
- FAQ list
- Contact form

#### O que mostra

| Item | Descrição |
|---|---|
| **FAQ** | Perguntas frequentes |
| **Contact Form** | Formulário para contato |
| **Support Docs** | Documentação de ajuda |

---

### 11. 🔐 **Login** - Autenticação

**Rota:** `/login`  
**Arquivo:** `app/(auth)/login/page.tsx`  
**Componentes:**
- `LoginForm` - Email + Password

#### O que faz

1. Usuário entra email e password
2. Form envia POST para NextAuth
3. NextAuth chama backend para validar
4. Se válido, retorna JWT token
5. NextAuth armazena em cookie session
6. Redireciona para `/dashboard`

**Dados:**
- ✅ Reais: Validação no backend

---

### 12. 👨‍💻 **Dashboard Development** - Developer Tools

**Rota:** `/dashboard-development`  
**Arquivo:** `app/(dashboard)/dashboard-development/page.tsx`  
**Acesso:** ADMIN e Super User apenas

#### O que mostra

| Seção | Descrição | O que faz |
|---|---|---|
| **Feature Flags** | Lista de todas as features | Enable/disable features |
| **Menu Visibility** | Menu items visiblidade | Show/hide/pending status |
| **Menu by Role** | Qual role vê qual feature | Configure per-role access |
| **Save Button** | Persistir alterações | POST para `/api/dev-menu` |

**Features Gerenciáveis:**
- DASHBOARD
- AGENDA
- COLABORADORES
- COMERCIAL
- FINANCEIRO
- INDICADORES
- CONFIGURACOES
- OPERACAO
- PROCESSOS
- SUPORTE
- SUPER_USER_DASHBOARD

**Dados:**
- ✅ Reais: Fetch de `/api/dev-menu`
- ✅ Reais: Persistem via PATCH em `/api/dev-menu/:featureId`

---

## 🎮 GAMIFICAÇÃO (Integração)

**Componentes:**
- `leaderboard.tsx` - Ranking visual
- `achievement-badge.tsx` - Badges de achievement
- `rewards-panel.tsx` - Rewards

**O que faz:**
- Rastreia desempenho de cada colaborador
- Calcula achievements (meta atingida, top vendedor)
- Mostra badges/medalhas
- Cria competição saudável

**Dados:**
- ✅ Reais: Vêm do backend gamification

---

## 🔐 AUTENTICAÇÃO E ROLES

### Fluxo de Login
```
1. User acessa /login
2. Entra email + password
3. LoginForm POST /api/auth/signin (NextAuth)
4. NextAuth chama callback
5. Callback faz POST para backend /api/auth/login
6. Backend valida e retorna JWT
7. NextAuth armazena em session
8. Redireciona para /dashboard
```

### Roles (Papéis)
```
ADMIN
├─ Acesso total
├─ Pode editar usuários
├─ Acesso a /configuracoes
└─ Acesso a /dashboard-development

GESTOR
├─ Acesso a maior parte
├─ Pode editar COLABORADOR
└─ Acesso a /configuracoes

COLABORADOR
├─ Acesso limitado
├─ Dashboard pessoal
├─ Seu agenda
└─ BLOQUEADO em /configuracoes

SUPER_USER
├─ Acesso admin especial
├─ Developer dashboard
└─ Gerenciamento de features
```

### Route Protection
**Arquivo:** `lib/route-protection.ts`  
**Estratégia:**
- Redirect middleware no layout
- Check role na página
- Redirect para `/access-denied` se não autorizado

---

## 📊 DADOS REAIS vs MOCKADOS

### ✅ Dados Reais (do Backend)

| Dados | Origem | Endpoint |
|-------|--------|----------|
| Usuários | Backend PostgreSQL | `/api/users` |
| Tarefas | Backend PostgreSQL | `/api/tasks` |
| Checklists | Backend PostgreSQL | `/api/checklists` |
| Sessão/Auth | NextAuth + Backend | `/api/auth/token` |
| Dashboard KPIs | Financeiro + Fone Ninja | `/api/dashboard` |
| Faturamento | Fone Ninja | API externa |
| Vendas | Fone Ninja | API externa |
| Features/Menu | Backend | `/api/dev-menu` |
| Gamification | Backend | `/api/gamification` |

### ❌ Dados Mockados

**Localização:** `app/(dashboard)/data/mock.ts`

Atualmente **não há dados mockados em produção**. Se API cai:
- Dashboard mostra "—" ou vazio
- Logs de erro no console
- Mensagens ao usuário

---

## 🚀 COMO RODAR O PROJETO

### Pré-requisitos
```bash
Node.js 18+ (LTS)
npm ou yarn
Backend rodando em http://localhost:3001
PostgreSQL rodando (para backend)
```

### Instalação
```bash
# Clonar repo
git clone ...
cd frontend-guimi-os

# Instalar dependências
npm install

# Copiar .env.local
cp .env.example .env.local

# Editar .env.local com valores corretos
# NEXT_PUBLIC_API_URL=http://localhost:3001
# AUTH_SECRET=min-32-chars
# AUTH_URL=http://localhost:3000
```

### Rodar desenvolvimento
```bash
# Start dev server
npm run dev

# Acesso http://localhost:3000
```

### Build production
```bash
npm run build
npm run start
```

### Testes
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Com UI interativa
npm run test:e2e:ui
```

---

## 🐛 PROBLEMAS CONHECIDOS & TODOs

### Issues Críticas (2026-04-30)

1. **Super Usuário Access Denied**
   - Super user não consegue entrar em `/configuracoes`
   - Deveria ter acesso admin + especial
   - Status: 🔴 Não resolvido

2. **Developer Menu - Sem Save**
   - Menu de developer não tem botão SAVE
   - Alterações não persistem
   - Status: 🔴 Não implementado

3. **Super User na Lista de Colaboradores**
   - Super admin aparece na lista `/colaboradores`
   - Deveria estar oculto
   - Status: 🔴 Não resolvido

4. **Super User na Gamification**
   - Super user aparece em leaderboards
   - Deveria estar oculto em todas as telas
   - Status: 🔴 Não resolvido

### UI/UX Issues

5. **Emojis em Componentes**
   - ❌ NÃO USAR emojis no código
   - ✅ USE biblioteca Lucide React
   - Status: 🟡 Parcialmente implementado

### Feature Flags

6. **Menu Visibility Control**
   - Deveria permitir: Ocultar, Visível mas desativado (com "em breve")
   - Atualmente: Apenas toggle on/off
   - Status: 🟡 Parcialmente implementado

---

## 📞 CONTATOS & RESPONSABILIDADES

**Desenvolvedor Frontend:** Seu email aqui  
**Desenvolvedor Backend:** Backend dev aqui  
**Designer/UX:** UX person aqui  
**Product Manager:** PM aqui  

---

## 📝 NOTAS FINAIS

### Boas Práticas Utilizadas
✅ TypeScript strict mode  
✅ Separação em camadas (components → service → repo → api)  
✅ Componentes reutilizáveis (shadcn/ui)  
✅ Server components onde possível (SSR)  
✅ Error boundaries e fallbacks  
✅ Tests (unit + E2E)  

### O que Falta
❌ Integração Kommo CRM (planejada)  
❌ Relatórios exportáveis  
❌ Notificações em tempo real  
❌ Offline mode  
❌ Maior cobertura de testes  

### Performance
- ⚡ Next.js 16 com React 19
- 🎯 Server components para reduzir JS
- 📦 Code splitting automático
- 🖼️ Image optimization
- 📊 Caching estratégico

---

**Documento gerado:** 2026-05-03  
**Versão:** 1.0  
**Próxima revisão:** Quando features maiores forem adicionadas
