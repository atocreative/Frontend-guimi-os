# 🎨 Resumo de Mudanças Frontend + Especificação Backend

**Data:** 2026-04-29  
**Realizado por:** OpenClaude  
**Status:** ✅ Frontend pronto para integração  

---

## 📋 Índice

1. [Mudanças de Layout & Cores](#mudanças-de-layout--cores)
2. [Componentes Atualizados](#componentes-atualizados)
3. [O que o Backend Precisa Fazer](#o-que-o-backend-precisa-fazer)
4. [Integração de Dados](#integração-de-dados)
5. [Próximas Etapas](#próximas-etapas)

---

## 🎨 Mudanças de Layout & Cores

### Paleta de Cores Aplicada

**Cores da Logo Guimi:**
- **Primária:** #282828 (Cinza Escuro) - `oklch(0.16 0 0)` em OKLCH
- **Secundária:** #0f42f2 (Azul Vivo) - `oklch(0.38 0.32 264)` em OKLCH

### Arquivo Modificado: `app/globals.css`

#### Light Theme `:root`
```css
--guimi-primary: #282828;     /* Cinza escuro */
--guimi-secondary: #0f42f2;   /* Azul vivo */

--primary: oklch(0.16 0 0);           /* Cinza escuro (#282828) */
--primary-foreground: oklch(0.985 0 0); /* Branco */
--secondary: oklch(0.38 0.32 264);    /* Azul vivo (#0f42f2) */
--secondary-foreground: oklch(0.985 0 0); /* Branco */

--accent: oklch(0.38 0.32 264);       /* Azul como accent */
--ring: oklch(0.38 0.32 264);         /* Azul para focus ring */

/* Charts & Indicators */
--chart-1: oklch(0.38 0.32 264);      /* Azul */
--chart-2: oklch(0.16 0 0);           /* Cinza */
--chart-3: oklch(0.488 0.243 264);    /* Azul claro */

/* Sidebar */
--sidebar: oklch(0.16 0 0);           /* Cinza escuro */
--sidebar-primary: oklch(0.38 0.32 264); /* Azul */
```

#### Dark Theme `.dark`
```css
--background: oklch(0.12 0 0);        /* Muito escuro */
--primary: oklch(0.38 0.32 264);      /* Azul highlight */
--secondary: oklch(0.488 0.243 264);  /* Azul claro */

--sidebar: oklch(0.12 0 0);           /* Muito escuro */
--sidebar-primary: oklch(0.38 0.32 264); /* Azul */
```

### Impacto Visual

| Elemento | Antes | Depois |
|----------|-------|--------|
| **Sidebar** | Branco com preto | Cinza escuro (#282828) com azul (#0f42f2) |
| **Header** | Fundo claro | Segue tema |
| **Footer** | Cinza muito escuro | **Cinza escuro com detalhe azul** |
| **Botões Primários** | Cinza/preto | **Cinza escuro (#282828)** |
| **Botões Secundários** | Cinza claro | **Azul (#0f42f2)** |
| **Badges (Roles)** | Varios tons | Temas consistentes |
| **Avatars** | Cinza/branco | **Cinza escuro com branco** |
| **Focus Ring** | Cinza | **Azul** |
| **Progress Bars** | Verde | **Azul** |

---

## 🔧 Componentes Atualizados

### 1. **Footer** (`components/layout/footer.tsx`)

**Antes:**
```tsx
<footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
```

**Depois:**
```tsx
<footer className="border-t border-primary/20 bg-primary text-primary-foreground/70">
  <p className="flex items-center gap-2">
    <span className="text-secondary">●</span>
    GuimiCell OS © 2026 · Suporte operacional interno
  </p>
  <Link className="transition-colors hover:text-secondary hover:font-semibold" />
```

**Mudanças:**
- ✅ Background: `bg-zinc-950` → `bg-primary` (Cinza escuro)
- ✅ Texto: `text-zinc-400` → `text-primary-foreground/70` (Branco com transparência)
- ✅ Border: `border-zinc-800/80` → `border-primary/20`
- ✅ Hover links: `hover:text-white` → `hover:text-secondary` (Azul)
- ✅ Indicador visual: Adicionado `●` azul para destaque

---

### 2. **Header** (`components/layout/header.tsx`)

**Antes:**
```tsx
<AvatarFallback className="text-xs bg-zinc-900 text-white">
```

**Depois:**
```tsx
<AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
<Badge className="text-xs hidden md:block bg-secondary text-secondary-foreground">
```

**Mudanças:**
- ✅ Avatar: `bg-zinc-900` → `bg-primary`
- ✅ Badge Role: Novo estilo com `bg-secondary text-secondary-foreground`
- ✅ Adicionado `font-semibold` para melhor legibilidade

---

### 3. **Coluna Pessoa** (`components/agenda/coluna-pessoa.tsx`)

**Antes:**
```tsx
<AvatarFallback className="text-xs bg-zinc-900 text-white">
<div className="h-full bg-emerald-500 rounded-full transition-all" />
```

**Depois:**
```tsx
<AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
<div className="h-full bg-secondary rounded-full transition-all" />
```

**Mudanças:**
- ✅ Avatar: `bg-zinc-900` → `bg-primary`
- ✅ Progress Bar: `bg-emerald-500` → `bg-secondary` (Azul)
- ✅ Adicionado `font-semibold` para avatars

---

### 4. **Filtro Usuário** (`components/agenda/filtro-usuario.tsx`)

**Antes:**
```tsx
selecionado === u.id
  ? "bg-zinc-900 text-white border-zinc-900"
  : "bg-background hover:bg-muted border-border"
<AvatarFallback className="text-xs bg-zinc-200 text-zinc-700">
```

**Depois:**
```tsx
selecionado === u.id
  ? "bg-primary text-primary-foreground border-primary"
  : "bg-background hover:bg-muted border-border"
<AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-semibold">
```

**Mudanças:**
- ✅ Selecionado: Usa `bg-primary` ao invés de zinc
- ✅ Avatar: `bg-zinc-200` → `bg-secondary`

---

### 5. **Colaborador Card** (`components/colaboradores/colaborador-card.tsx`)

**Antes:**
```tsx
const roleCor: Record<string, string> = {
  ADMIN: "bg-zinc-900 text-white border-zinc-900",
  GESTOR: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  COLABORADOR: "bg-zinc-100 text-zinc-700 border-zinc-200",
}
```

**Depois:**
```tsx
const roleCor: Record<string, string> = {
  ADMIN: "bg-primary text-primary-foreground border-primary",
  GESTOR: "bg-secondary/10 text-secondary border-secondary/20",
  COLABORADOR: "bg-muted text-muted-foreground border-muted",
}
```

**Mudanças:**
- ✅ ADMIN: Usa `bg-primary` (Cinza escuro)
- ✅ GESTOR: Usa `bg-secondary/10` com `text-secondary` (Azul)
- ✅ COLABORADOR: Usa `bg-muted` (Cinza claro)
- ✅ Avatar fallback: Atualizado para usar tema

---

## 🚀 O que o Backend Precisa Fazer

### **Prioridade P0 (CRÍTICA) - Implementar Imediatamente**

#### 1. **Expandir Model User com Gamificação**

```prisma
model User {
  // Campos existentes...
  id                    String      @id @default(cuid())
  name                  String
  email                 String      @unique
  password              String      @bcrypt
  jobTitle              String?
  phone                 String?
  avatarUrl             String?
  active                Boolean     @default(true)
  role                  Role        @default(COLABORADOR)
  
  // ✨ NOVOS CAMPOS DE GAMIFICAÇÃO
  level                 Int         @default(1)         // 1-4 (Bronze, Prata, Ouro, Platina)
  points                Int         @default(0)         // Pontos no mês atual
  temperature           Temperature @default(FRIO)      // QUENTE/MORNO/FRIO
  lastActivityAt        DateTime?                        // Para calcular engajamento
  
  // Relacionamentos
  tasks                 Task[]
  badges                GamificationBadge[]
  monthlyStats          GamificationMonthlyStats[]
  activities            GamificationActivity[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?
}

enum Role {
  ADMIN
  GESTOR
  COLABORADOR
}

enum Temperature {
  QUENTE
  MORNO
  FRIO
}
```

**Migrações necessárias:**
```sql
ALTER TABLE "User" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "temperature" VARCHAR(10) NOT NULL DEFAULT 'FRIO';
ALTER TABLE "User" ADD COLUMN "lastActivityAt" TIMESTAMP;
```

---

#### 2. **Criar Models de Gamificação**

```prisma
/* Badge Unlock System */
model GamificationBadge {
  id                    String      @id @default(cuid())
  name                  String      // Ex: "Iniciante", "Mestre"
  slug                  String      @unique
  description           String
  icon                  String      // URL ou emoji
  rarity                Rarity      @default(COMUM)
  criteria              String      // JSON com regras
  pointsReward          Int         @default(0)
  unlockedBy            GamificationUserBadge[]
  createdAt             DateTime    @default(now())
  
  @@index([slug])
}

model GamificationUserBadge {
  id                    String      @id @default(cuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  badgeId               String
  badge                 GamificationBadge @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  unlockedAt            DateTime    @default(now())
  
  @@unique([userId, badgeId])
  @@index([userId])
}

/* Monthly Statistics */
model GamificationMonthlyStats {
  id                    String      @id @default(cuid())
  month                 Int         // 1-12
  year                  Int
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tasksCompleted        Int         @default(0)
  tasksCreated          Int         @default(0)
  tasksOnTime           Int         @default(0)
  checklistsClosed      Int         @default(0)
  pointsEarned          Int         @default(0)
  rank                  Int         @default(0)
  badgesUnlocked        Int         @default(0)
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@unique([userId, month, year])
  @@index([year, month])
}

/* Activity Log */
model GamificationActivity {
  id                    String      @id @default(cuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type                  ActivityType
  description           String
  pointsEarned          Int         @default(0)
  relatedTaskId         String?
  relatedChecklistId    String?
  createdAt             DateTime    @default(now())
  
  @@index([userId])
  @@index([createdAt])
}

enum Rarity {
  COMUM
  RARO
  EPICO
  LENDARIO
}

enum ActivityType {
  TASK_COMPLETED
  TASK_ON_TIME
  CHECKLIST_CLOSED
  FIRST_TASK
  STREAK_7_DAYS
  STREAK_30_DAYS
  NO_MISSED_TASK
  TEAM_HELPER
}
```

---

#### 3. **Endpoints Fundamentais Requeridos**

```bash
# COLABORADORES
GET    /api/users?skip=0&take=10&active=true&role=COLABORADOR
  Response: { data: User[], total: number }
  
GET    /api/users/:id
  Response: { data: User }
  
POST   /api/users
  Auth: ADMIN
  Body: { name, email, password, jobTitle, phone, role }
  Response: { data: User }

PATCH  /api/users/:id
  Auth: ADMIN or self
  Body: { name, jobTitle, phone, avatarUrl }
  Response: { data: User }

DELETE /api/users/:id
  Auth: ADMIN
  Response: { message: "Usuário deletado" }

# GAMIFICAÇÃO
GET    /api/gamificacao/leaderboard?month=4&year=2026
  Response: {
    data: [
      { rank: 1, userId, name, points, level, temperature, badge: "Mestre" },
      ...
    ]
  }

GET    /api/gamificacao/usuarios/:id/stats
  Response: {
    data: {
      currentLevel: 3,
      points: 450,
      temperature: "QUENTE",
      badges: [{ name, icon, unlockedAt }],
      monthlyStats: { tasksCompleted, pointsEarned, rank },
      recentActivities: [...]
    }
  }

# TAREFAS (ATUALIZAR para gatilho de gamificação)
PATCH  /api/tasks/:id
  Body: { status, priority, ... }
  Response: { 
    data: Task, 
    points?: number,         // Novidade: pontos ganhos
    leveledUp?: true,        // Novidade: subiu de nível?
    badgeUnlocked?: Badge    // Novidade: badge desbloqueada?
  }
```

---

### **Prioridade P1 (ALTA) - Próximas 2 Semanas**

#### 4. **Operações/Equipamentos**

```prisma
model Equipment {
  id                    String      @id @default(cuid())
  name                  String
  code                  String      @unique
  description           String?
  category              String
  status                EquipmentStatus @default(ATIVO)
  location              String?
  lastMaintenanceAt     DateTime?
  nextMaintenanceAt     DateTime?
  serialNumber          String?
  manufacturer          String?
  model                 String?
  purchaseDate          DateTime?
  warrantyUntil         DateTime?
  maintenanceLogs       MaintenanceLog[]
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([category])
  @@index([status])
}

model MaintenanceLog {
  id                    String      @id @default(cuid())
  equipmentId           String
  equipment             Equipment   @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  type                  MaintenanceType
  description           String
  performedAt           DateTime    @default(now())
  performedBy           String
  cost                  Decimal?
  
  @@index([equipmentId])
  @@index([performedAt])
}

enum EquipmentStatus {
  ATIVO
  INATIVO
  EM_MANUTENCAO
  DESCARTADO
}

enum MaintenanceType {
  PREVENTIVA
  CORRETIVA
  INSPEÇÃO
}
```

**Endpoints:**
```bash
GET    /api/operacao/equipamentos?status=ATIVO&skip=0&take=10
GET    /api/operacao/equipamentos/:id
POST   /api/operacao/equipamentos
PATCH  /api/operacao/equipamentos/:id
POST   /api/operacao/equipamentos/:id/maintenance
```

---

#### 5. **Financeiro (Dados Reais)**

```prisma
model FinancialSnapshot {
  id                    String      @id @default(cuid())
  date                  DateTime    @unique
  month                 Int
  year                  Int
  
  totalRevenue          Decimal     @default(0)
  totalExpense          Decimal     @default(0)
  grossProfit           Decimal     @default(0)
  netProfit             Decimal     @default(0)
  
  revenueByCategory     String      // JSON
  expenseByCategory     String      // JSON
  
  revenue               Revenue[]
  expenses              Expense[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([date])
  @@index([month, year])
}

model Revenue {
  id                    String      @id @default(cuid())
  description           String
  category              String
  amount                Decimal
  source                RevenueSource
  externalId            String?     // FoneNinja ID
  date                  DateTime
  month                 Int
  year                  Int
  
  snapshotId            String
  snapshot              FinancialSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime    @default(now())
  
  @@index([source])
  @@index([date])
  @@index([month, year])
}

model Expense {
  id                    String      @id @default(cuid())
  description           String
  category              String
  amount                Decimal
  status                ExpenseStatus @default(PENDENTE)
  paidAt                DateTime?
  source                ExpenseSource
  externalId            String?     // Meu Assessor ID
  dueAt                 DateTime
  month                 Int
  year                  Int
  
  snapshotId            String
  snapshot              FinancialSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([source])
  @@index([status])
  @@index([dueAt])
  @@index([month, year])
}

enum RevenueSource {
  FENENINJA
  MANUAL
  INTEGRACAO
}

enum ExpenseSource {
  MEUASSESSOR
  MANUAL
  INTEGRACAO
}

enum ExpenseStatus {
  PENDENTE
  PAGO
  CANCELADO
}
```

**Endpoints:**
```bash
GET    /api/financeiro/snapshot?month=4&year=2026
GET    /api/financeiro/receitas?month=4&year=2026&category=vendas
GET    /api/financeiro/despesas?month=4&year=2026&status=PENDENTE
POST   /api/financeiro/despesas
PATCH  /api/financeiro/despesas/:id
```

---

### **Prioridade P2 (MÉDIA) - Próximas 3-4 Semanas**

#### 6. **Leads/Comercial (Kommo CRM)**

```prisma
model Lead {
  id                    String      @id @default(cuid())
  kommoId               String?     @unique
  name                  String
  phone                 String?
  email                 String?
  stage                 LeadStage   @default(PROSPECTIVA)
  temperature           Temperature @default(FRIO)
  estimatedValue        Decimal?
  lastContactAt         DateTime?
  nextFollowUpAt        DateTime?
  convertedAt           DateTime?
  lostAt                DateTime?
  ownerId               String?
  owner                 User?       @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  sales                 Sale[]
  notes                 LeadNote[]
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([stage])
  @@index([temperature])
  @@index([ownerId])
  @@index([kommoId])
}

enum LeadStage {
  PROSPECTIVA
  QUALIFICACAO
  PROPOSTA
  NEGOZIACAO
  FECHAMENTO
  OPORTUNIDADE_PERDIDA
}
```

---

#### 7. **Suporte**

```prisma
model SupportTicket {
  id                    String      @id @default(cuid())
  subject               String
  description           String
  status                TicketStatus @default(ABERTO)
  priority              Priority    @default(MEDIA)
  visitorName           String?
  visitorEmail          String?
  visitorPhone          String?
  assignedTo            String?
  assignee              User?       @relation(fields: [assignedTo], references: [id], onDelete: SetNull)
  messages              TicketMessage[]
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  closedAt              DateTime?
  
  @@index([status])
  @@index([priority])
  @@index([assignedTo])
}

model FAQ {
  id                    String      @id @default(cuid())
  question              String      @unique
  answer                String
  category              String
  order                 Int         @default(0)
  active                Boolean     @default(true)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([category])
  @@index([active])
}

enum TicketStatus {
  ABERTO
  EM_ANDAMENTO
  AGUARDANDO_RESPOSTA
  RESOLVIDO
  FECHADO
}
```

---

## 📊 Integração de Dados

### **Fluxo 1: Tarefa → Gamificação → Leaderboard**

```
1. User completa tarefa:
   PATCH /api/tasks/:taskId { status: "CONCLUIDA" }
   
2. Backend:
   ✅ Marca tarefa como concluída
   ✅ Calcula se foi on-time (dueAt vs completedAt)
   ✅ Cria GamificationActivity (10 pts base, +5 se on-time)
   ✅ Atualiza User.points (+15 pts total)
   ✅ Verifica badges desbloqueadas
   ✅ Atualiza GamificationMonthlyStats
   ✅ Recalcula rank/leaderboard
   
3. Retorna para Frontend:
   {
     task: { ... status: "CONCLUIDA" },
     points: 15,
     leveledUp: false,
     badgeUnlocked: null
   }
   
4. Frontend exibe toast com ganho de pontos
5. Leaderboard se atualiza em tempo real (ou pull de novo)
```

---

### **Fluxo 2: Dashboard Financeiro**

```
1. User acessa /financeiro
   
2. Frontend faz 3 requests em paralelo:
   GET /api/financeiro/snapshot?month=4&year=2026
   GET /api/financeiro/receitas?month=4&year=2026
   GET /api/financeiro/despesas?month=4&year=2026
   
3. Backend retorna agregações calculadas:
   {
     snapshot: {
       totalRevenue: 15000.00,
       totalExpense: 5000.00,
       grossProfit: 10000.00,
       netProfit: 9500.00,
       revenueByCategory: { "vendas": 10000, "serviços": 5000 },
       expenseByCategory: { "operacional": 3000, "marketing": 2000 }
     },
     receitas: [
       { id, description, category, amount, date, source },
       ...
     ],
     despesas: [
       { id, description, category, amount, status, dueAt, source },
       ...
     ]
   }
   
4. Frontend renderiza gráficos (Recharts)
```

---

### **Fluxo 3: Sincronização FoneNinja**

```
1. Diariamente (cron job):
   backend chama FoneNinja API
   
2. Para cada venda encontrada:
   - Se não existe Revenue, cria
   - Se existe, atualiza
   - Marca source=FENENINJA
   
3. Recalcula FinancialSnapshot para o mês
   
4. Frontend exibe dados atualizados automaticamente
   (pull de /api/financeiro/receitas)
```

---

## 📋 Próximas Etapas

### **Fase 1: Banco de Dados (Esta Semana)**

- [ ] **Executar migrations** para adicionar campos em User
- [ ] **Criar models** de Gamificação
- [ ] **Seed de badges** com ícones e critérios
- [ ] **Executar migrations** para Equipment, Revenue, Expense
- [ ] **Criar índices** para performance

### **Fase 2: Endpoints Básicos (Próxima Semana)**

- [ ] GET /api/users com paginação
- [ ] GET /api/gamificacao/leaderboard
- [ ] GET /api/gamificacao/usuarios/:id/stats
- [ ] Atualizar PATCH /api/tasks/:id para retornar points/badges
- [ ] GET /api/operacao/equipamentos
- [ ] GET /api/financeiro/snapshot

### **Fase 3: Lógica de Gamificação (2 Semanas)**

- [ ] Cálculo de pontos ao completar tarefas
- [ ] Desbloqueio automático de badges
- [ ] Cálculo de temperatura (QUENTE/MORNO/FRIO)
- [ ] Atualização de leaderboard mensal

### **Fase 4: Integrações (3-4 Semanas)**

- [ ] FoneNinja sync
- [ ] Kommo CRM sync
- [ ] Meu Assessor sync
- [ ] Agregação automática de dados

---

## 🎯 Comunicação

**Se tiver dúvidas sobre:**

- **Estrutura de banco de dados:** Ver `DATABASE_SPECIFICATION.md`
- **Endpoints esperados:** Ver section "O que o Backend Precisa Fazer"
- **Fluxos de dados:** Ver section "Integração de Dados"
- **Mudanças visuais:** Ver "Mudanças de Layout & Cores"

**Status do Frontend:**
- ✅ Layout com cores da logo implementado
- ✅ Estrutura de componentes pronta
- ✅ Type definitions em place
- ✅ Schemas de validação Zod prontos
- ⏳ Aguardando dados reais do backend

---

**Próxima Reunião:** Confirmar prazos de implementação backend  
**Documentação Relacionada:**
- `DATABASE_SPECIFICATION.md` - Especificação completa de BD
- `CLAUDE.md` - Instruções de uso do projeto

