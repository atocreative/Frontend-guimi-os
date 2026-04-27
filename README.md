# Guimicell OS — Frontend

Internal operational dashboard for Guimicell. Built with Next.js 16, NextAuth v5, and TypeScript.

## Overview

Guimicell OS is a real-time operational dashboard that provides:
- **Dashboard** — Financial metrics, KPIs, and task overview for admin users
- **Agenda (Tasks)** — Task management with priority and due date tracking
- **Colaboradores** — Team member management and performance metrics
- **Comercial** — Sales pipeline and lead tracking
- **Financeiro** — Revenue and expense tracking
- **Indicadores** — Performance metrics and analytics
- **Configurações** — System settings and user management

All data is synchronized with the backend API in real-time.

## Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- A running backend API (default: `http://localhost:3001`)

### Setup

1. Clone the repository:
```bash
git clone https://gitlab.com/joaogabrieloliversouza/frontend-guimi-os.git
cd frontend-guimi-os
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your values:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=your-secret-key-here-min-32-chars
AUTH_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |
| `AUTH_SECRET` | NextAuth session secret (min 32 chars) | Your secure secret key |
| `AUTH_URL` | Frontend URL for OAuth callbacks | `http://localhost:3000` |

Create `.env.local` from `.env.example` and update values for your environment.

## Scripts

```bash
# Development
npm run dev           # Start dev server with hot reload

# Building
npm run build         # Build for production
npm run start         # Start production server

# Testing
npm run test          # Run all tests
npm run test:unit     # Run Jest unit tests
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run E2E tests with Playwright UI

# Linting
npm run lint          # Run ESLint
```

## Project Structure

```
.
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Login page (public)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with footer
│   └── providers.tsx      # NextAuth and context providers
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── agenda/           # Task management components
│   ├── colaboradores/    # Team management components
│   ├── layout/           # Layout components (sidebar, header)
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and services
│   ├── api-client.ts     # Backend HTTP client
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   ├── task-utils.ts     # Task helpers (sorting, status)
│   └── utils.ts          # General utilities
├── types/                 # TypeScript type definitions
├── public/               # Static assets (logo, favicon)
├── tests/                # Automated tests
│   ├── unit/            # Jest unit tests
│   └── e2e/             # Playwright E2E tests
└── auth.ts              # NextAuth configuration
```

## Authentication Flow

1. **Login** — User submits email and password at `/login`
2. **Session** — Backend validates credentials and returns JWT
3. **Protected Routes** — Dashboard routes redirect unauthenticated users to `/login`
4. **Role-Based Access** — Some routes check user role (ADMIN, GESTOR, COLABORADOR)
   - COLABORADOR users are redirected from `/configuracoes` to homepage
   - ADMIN/GESTOR can access all settings

## Backend Integration

The frontend communicates with the backend API through a centralized service layer:

```typescript
// Using the service layer (recommended)
import { backendService } from "@/lib/services/backend-service"

const tasks = await backendService.getTasks()
const dashboard = await backendService.getDashboard()
const users = await backendService.getUsers()
```

All data fetches go through:
1. **Service Layer** (`lib/services/backend-service.ts`) — Business logic and error handling
2. **Repository Layer** (`lib/repositories/backend-repository.ts`) — Data access abstraction
3. **API Client** (`lib/api-client.ts`) — HTTP communication with backend

**Note:** UI components should never import from `api-client.ts` directly. Always use the service layer.

## Dashboard Behavior

### Admin Dashboard
- Real-time financial KPIs (revenue, expenses, margin)
- Monthly financial overview with 6-month and weekly trends
- Task priority matrix
- Top performers ranking
- Pending and due-today tasks

### Colaborador (Team Member) Dashboard
- Personal task completion rate
- Today's tasks and pending items
- Achievements and performance metrics

### Data Loading
- Dashboard data is fetched server-side or via client-side service calls
- Financial data requires authentication (bearer token)
- Empty states show "—" when data is not available from the backend

## Testing

### Unit Tests
Tests for utility functions and the service boundary:
```bash
npm run test:unit
npm run test:unit:watch
```

Located in `tests/unit/`:
- `task-utils.test.ts` — Sorting, priority, status helpers
- `backend-service.test.ts` — Service layer contracts

### E2E Tests
Browser-based tests for user flows:
```bash
npm run test:e2e
npm run test:e2e:ui
```

Located in `tests/e2e/`:
- `login.spec.ts` — Login flow and validation
- `dashboard.spec.ts` — Dashboard rendering
- `agenda.spec.ts` — Task management
- `colaboradores.spec.ts` — Team member management
- `configuracoes.spec.ts` — Settings and role-based access

### Smoke Scripts
Legacy Node scripts for manual verification:
```bash
node tests/test-auth.js
node tests/test-integration.js
node tests/run-all-tests.js
```

## Development Tips

### Hot Reload
The dev server supports fast refresh — changes to components and styles are reflected immediately.

### API Testing
If the backend is not available, dashboard will show:
- `— (Aguardando dados)` for KPI cards
- Error messages for failed data loads

### TypeScript
The project uses strict TypeScript. Run type checking:
```bash
npm run lint
```

## Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment
Set appropriate environment variables in your deployment platform:
- `NEXT_PUBLIC_API_URL` — Backend API URL (can be public)
- `AUTH_SECRET` — Secure random string (min 32 chars)
- `AUTH_URL` — Frontend URL for OAuth callbacks

### Security
- `AUTH_SECRET` must be a cryptographically secure random string
- Never commit `.env` files with real secrets
- Use `.env.local` for local development (ignored in git)

## Support

For issues, questions, or contributions, please reach out to the development team.

---

**Guimicell © 2026** — All rights reserved to ATO.
