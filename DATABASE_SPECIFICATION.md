# 📊 Especificação de Banco de Dados - Guimi OS

**Data:** 2026-04-29  
**Responsável Frontend:** OpenClaude  
**Responsável Backend:** [Backend Team]  
**Status:** 🔄 Aguardando Implementação

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Modelos de Dados Necessários](#modelos-de-dados-necessários)
3. [Endpoints API Requeridos](#endpoints-api-requeridos)
4. [Integrações Externas](#integrações-externas)
5. [Fluxos de Dados](#fluxos-de-dados)
6. [Considerações de Segurança](#considerações-de-segurança)

---

## 🎯 Visão Geral

O frontend foi desenvolvido com estrutura pronta para receber dados de múltiplas fontes:

- **Internos (BD):** Tarefas, Usuários, Checklists, Colaboradores (Gamificação)
- **Externos (APIs):** FoneNinja (vendas), Kommo CRM (leads), Meu Assessor (despesas)
- **Agregados (BI):** Dashboard financeiro, indicadores, operações

### Arquitetura de Dados Esperada

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Next.js)                         │
│  http://localhost:3000                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┴───────────┬────────────────┐
       │                       │                │
┌──────▼──────┐    ┌──────────▼────────┐    ┌──▼─────────┐
│  Backend    │    │  External APIs    │    │  Database  │
│ (localhost  │    │  - FoneNinja      │    │ PostgreSQL │
│  :3001)     │    │  - Kommo CRM      │    │            │
│             │    │  - Meu Assessor   │    │ Prisma ORM │
│ REST API    │    └──────────────────┘    └────────────┘
└─────────────┘
```

---

## 📦 Modelos de Dados Necessários

### 1. **COLABORADORES (Expandido)**

**Objetivo:** Gerenciar dados completos de colaboradores com histórico de gamificação.

**Modelo Prisma:**

```prisma
model User {
  id                    String      @id @default(cuid())
  
  // Informações Básicas
  name                  String
  email                 String      @unique
  password              String      @bcrypt
  jobTitle              String?
  phone                 String?
  avatarUrl             String?
  active                Boolean     @default(true)
  role                  Role        @default(COLABORADOR)
  
  // Gamificação
  level                 Int         @default(1)
  points                Int         @default(0)
  temperature           Temperature @default(FRIO)
  lastActivityAt        DateTime?
  
  // Relacionamentos
  tasks                 Task[]
  badges                GamificationBadge[]
  monthlyStats          GamificationMonthlyStats[]
  activities            GamificationActivity[]
  
  // Metadata
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?
  
  @@index([email])
  @@index([active])
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

**Campos Adicionais Necessários:**
- `level` - Nível atual (Bronze, Prata, Ouro, Platina)
- `points` - Pontos acumulados no mês
- `temperature` - Status de engajamento (QUENTE/MORNO/FRIO)
- `lastActivityAt` - Último acesso/atividade

**Validações:**
- Email único
- Senha com hash (Argon2id ou bcrypt)
- Role válido (ADMIN, GESTOR, COLABORADOR)
- Phone em formato internacional

---

### 2. **GAMIFICAÇÃO**

**Objetivo:** Rastrear conquistas, badges, pontos e ranking dos colaboradores.

**Modelo Prisma:**

```prisma
model GamificationBadge {
  id                    String      @id @default(cuid())
  
  // Badge Info
  name                  String
  slug                  String      @unique
  description           String
  icon                  String      // URL ou emoji
  rarity                Rarity      @default(COMUM)
  
  // Critérios
  criteria              String      // JSON: { type: 'tasks_completed', value: 10 }
  pointsReward          Int         @default(0)
  
  // Usuários que possuem
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

model GamificationMonthlyStats {
  id                    String      @id @default(cuid())
  
  // Período
  month                 Int         // 1-12
  year                  Int
  
  // Usuário
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Métricas
  tasksCompleted        Int         @default(0)
  tasksCreated          Int         @default(0)
  tasksOnTime           Int         @default(0)
  checklistsClosed      Int         @default(0)
  pointsEarned          Int         @default(0)
  rank                  Int         @default(0)
  
  // Badge unlocks this month
  badgesUnlocked        Int         @default(0)
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@unique([userId, month, year])
  @@index([year, month])
}

model GamificationActivity {
  id                    String      @id @default(cuid())
  
  // Referência
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Tipo de Atividade
  type                  ActivityType
  description           String
  pointsEarned          Int         @default(0)
  
  // Relacionamento com recurso
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
  MENTOR
  CUSTOM
}
```

**Badges Predefinidos:**
- 🎯 **Iniciante** (primeira tarefa) - 10 pontos
- ⚡ **Rápido** (5 tarefas on-time) - 25 pontos
- 🔥 **Em Fogo** (7 dias seguidos ativo) - 50 pontos
- 👑 **Mestre** (30 tarefas completas) - 100 pontos
- 🎪 **Ajudante** (ajudou 5 colegas) - 50 pontos
- 🌟 **Estrela** (ranking top 3 mensal) - 75 pontos

**Cálculo de Pontos:**
- Tarefa completada: 10 pontos
- Tarefa on-time: +5 pontos
- Checklist encerrado: 5 pontos
- Ajudar colega: 15 pontos
- Badge desbloqueado: variável (10-100)

**Cálculo de Nível (baseado em pontos mensais):**
- Bronze: 0-100 pontos
- Prata: 101-250 pontos
- Ouro: 251-500 pontos
- Platina: 501+ pontos

---

### 3. **TAREFAS & AGENDA** (Já Existente - Expandir)

**Modelo Prisma (ATUALIZAR):**

```prisma
model Task {
  id                    String      @id @default(cuid())
  
  // Informações Básicas
  title                 String
  description           String?
  status                TaskStatus  @default(PENDENTE)
  priority              Priority    @default(MEDIA)
  
  // Prazos
  dueAt                 DateTime?
  completedAt           DateTime?
  horario               String?     // HH:MM formato
  
  // Relacionamentos
  assigneeId            String?
  assignee              User?       @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  
  // Checklists asociadas
  checklists            ChecklistItem[]
  
  // Metadata
  relatedTo             String?     // ref a outra tarefa ou recurso
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?
  
  @@index([assigneeId])
  @@index([status])
  @@index([dueAt])
  @@index([createdAt])
}

enum TaskStatus {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}

enum Priority {
  ALTA
  MEDIA
  BAIXA
}

model ChecklistItem {
  id                    String      @id @default(cuid())
  
  // Informações
  titulo                String
  descricao             String?
  tipo                  ChecklistType @default(ABERTURA)
  
  // Status
  concluido             Boolean     @default(false)
  responsavel           String?
  
  // Horário
  horario               String?     // HH:MM formato
  ordem                 Int         @default(0)
  
  // Relacionamentos
  taskId                String?
  task                  Task?       @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([taskId])
  @@index([tipo])
}

enum ChecklistType {
  ABERTURA
  FECHAMENTO
}
```

**Funcionalidades Necessárias:**
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Filtros por assignee, status, prioridade
- ✅ Histórico de mudanças
- ✅ Cálculo automático de "on-time"
- ✅ Notificação ao completar

---

### 4. **OPERAÇÕES** (Inventário/Equipamentos)

**Objetivo:** Gerenciar equipamentos, estoque e manutenção.

**Modelo Prisma:**

```prisma
model Equipment {
  id                    String      @id @default(cuid())
  
  // Informações Básicas
  name                  String
  code                  String      @unique
  description           String?
  category              String
  
  // Status
  status                EquipmentStatus @default(ATIVO)
  location              String?
  lastMaintenanceAt     DateTime?
  nextMaintenanceAt     DateTime?
  
  // Dados Técnicos
  serialNumber          String?
  manufacturer          String?
  model                 String?
  purchaseDate          DateTime?
  warrantyUntil         DateTime?
  
  // Histórico
  maintenanceLogs       MaintenanceLog[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([category])
  @@index([status])
}

model MaintenanceLog {
  id                    String      @id @default(cuid())
  
  // Referência
  equipmentId           String
  equipment             Equipment   @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  
  // Registro
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

**Funcionalidades Necessárias:**
- ✅ Cadastro de equipamentos
- ✅ Rastreamento de localização
- ✅ Histórico de manutenção
- ✅ Alertas de manutenção vencida

---

### 5. **FINANCEIRO** (Dashboard e Dados Reais)

**Modelo Prisma:**

```prisma
model FinancialSnapshot {
  id                    String      @id @default(cuid())
  
  // Período
  date                  DateTime    @unique @default(now())
  month                 Int
  year                  Int
  
  // Totalizadores
  totalRevenue          Decimal     @default(0)
  totalExpense          Decimal     @default(0)
  grossProfit           Decimal     @default(0)
  netProfit             Decimal     @default(0)
  
  // Detalhes por Categoria
  revenueByCategory     String      // JSON: { 'vendas': 1000, 'serviços': 500 }
  expenseByCategory     String      // JSON: { 'operacional': 300, 'marketing': 200 }
  
  // Composição
  revenue               Revenue[]
  expenses              Expense[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([date])
  @@index([month, year])
}

model Revenue {
  id                    String      @id @default(cuid())
  
  // Info
  description           String
  category              String
  amount                Decimal
  
  // Origem
  source                RevenueSource  // FENENINJA, MANUAL, INTEGRACAO
  externalId            String?        // FoneNinja sale ID
  
  // Período
  date                  DateTime
  month                 Int
  year                  Int
  
  // Snapshot
  snapshotId            String
  snapshot              FinancialSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime    @default(now())
  
  @@index([source])
  @@index([date])
  @@index([month, year])
}

model Expense {
  id                    String      @id @default(cuid())
  
  // Info
  description           String
  category              String
  amount                Decimal
  
  // Status
  status                ExpenseStatus @default(PENDENTE)
  paidAt                DateTime?
  
  // Origem
  source                ExpenseSource  // MEUASSESSOR, MANUAL, INTEGRACAO
  externalId            String?        // Meu Assessor ID
  
  // Período
  dueAt                 DateTime
  month                 Int
  year                  Int
  
  // Snapshot
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

**Funcionalidades Necessárias:**
- ✅ Agregação diária/mensal de dados
- ✅ Importação automática de FoneNinja
- ✅ Importação automática de Meu Assessor
- ✅ Cálculo de margens e lucros
- ✅ Categorização automática

---

### 6. **COMERCIAL/LEADS** (Para Kommo CRM)

**Modelo Prisma:**

```prisma
model Lead {
  id                    String      @id @default(cuid())
  
  // ID Externo (Kommo)
  kommoId               String?     @unique
  
  // Informações de Contato
  name                  String
  phone                 String?
  email                 String?
  
  // Funil de Vendas
  stage                 LeadStage   @default(PROSPECTIVA)
  temperature           Temperature @default(FRIO)
  
  // Valor
  estimatedValue        Decimal?
  
  // Datas Importantes
  lastContactAt         DateTime?
  nextFollowUpAt        DateTime?
  convertedAt           DateTime?
  lostAt                DateTime?
  
  // Responsável
  ownerId               String?
  owner                 User?       @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  
  // Relacionamentos
  sales                 Sale[]
  notes                 LeadNote[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([stage])
  @@index([temperature])
  @@index([ownerId])
  @@index([kommoId])
}

model LeadNote {
  id                    String      @id @default(cuid())
  leadId                String
  lead                  Lead        @relation(fields: [leadId], references: [id], onDelete: Cascade)
  content               String
  createdAt             DateTime    @default(now())
  
  @@index([leadId])
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

**Funcionalidades Necessárias:**
- ✅ Sincronização bidirecional com Kommo
- ✅ Atualização de status em tempo real
- ✅ Histórico de interações

---

### 7. **SUPORTE & CONTATOS**

**Modelo Prisma:**

```prisma
model SupportTicket {
  id                    String      @id @default(cuid())
  
  // Informações
  subject               String
  description           String
  status                TicketStatus @default(ABERTO)
  priority              Priority    @default(MEDIA)
  
  // Contato
  visitorName           String?
  visitorEmail          String?
  visitorPhone          String?
  
  // Atribuição
  assignedTo            String?
  assignee              User?       @relation(fields: [assignedTo], references: [id], onDelete: SetNull)
  
  // Metadata
  messages              TicketMessage[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  closedAt              DateTime?
  
  @@index([status])
  @@index([priority])
  @@index([assignedTo])
}

model TicketMessage {
  id                    String      @id @default(cuid())
  ticketId              String
  ticket                SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  senderName            String
  senderEmail           String
  content               String
  
  createdAt             DateTime    @default(now())
  
  @@index([ticketId])
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

## 🔌 Endpoints API Requeridos

### **Autenticação** (`/api/auth`)

```
POST   /api/auth/login
  Body: { email, password, captchaAnswer }
  Response: { token, user, expiresIn }

POST   /api/auth/logout
  Response: { success }

POST   /api/auth/mfa/verify
  Body: { token, code }
  Response: { accessToken, refreshToken }

POST   /api/auth/refresh
  Body: { refreshToken }
  Response: { accessToken, refreshToken }
```

---

### **Colaboradores** (`/api/users`)

```
GET    /api/users
  Query: { skip, take, active, role }
  Response: { data: User[], total }

GET    /api/users/:id
  Response: { data: User }

POST   /api/users
  Auth: ADMIN
  Body: { name, email, password, jobTitle, phone, role }
  Response: { data: User, message }

PATCH  /api/users/:id
  Auth: ADMIN or self
  Body: { name, jobTitle, phone, avatarUrl }
  Response: { data: User }

DELETE /api/users/:id
  Auth: ADMIN
  Response: { message }

PATCH  /api/users/:id/role
  Auth: ADMIN
  Body: { role }
  Response: { data: User }

PATCH  /api/users/:id/password
  Auth: self
  Body: { currentPassword, newPassword }
  Response: { message }
```

---

### **Gamificação** (`/api/gamificacao`)

```
GET    /api/gamificacao/leaderboard
  Query: { month, year, scope: 'month' | 'all' }
  Response: { data: LeaderboardEntry[] }

GET    /api/gamificacao/usuarios/:id/stats
  Response: { 
    data: {
      currentLevel, points, badges,
      monthlyStats, activities, ...
    }
  }

GET    /api/gamificacao/badges
  Response: { data: Badge[] }

POST   /api/gamificacao/activity
  Auth: interno (backend event)
  Body: { userId, type, pointsEarned, relatedTaskId }
  Response: { data: Activity, badgeUnlocked? }
```

---

### **Tarefas/Agenda** (`/api/tasks`)

```
GET    /api/tasks
  Query: { 
    skip, take, status, priority, 
    assigneeId, dueAt, sortBy 
  }
  Response: { data: Task[], total }

GET    /api/tasks/:id
  Response: { data: Task with checklists }

POST   /api/tasks
  Auth: GESTOR+
  Body: { title, description, status, priority, dueAt, horario, assigneeId }
  Response: { data: Task, message }

PATCH  /api/tasks/:id
  Auth: GESTOR+ or assignee
  Body: { status, priority, dueAt, horario, assigneeId, ... }
  Response: { data: Task, message }
  Side Effect: Trigger gamification points if status='CONCLUIDA'

DELETE /api/tasks/:id
  Auth: GESTOR+
  Response: { message }

POST   /api/tasks/:id/complete
  Auth: assignee or GESTOR+
  Response: { data: Task, points?, badge? }
```

---

### **Checklists** (`/api/checklists`)

```
GET    /api/checklists
  Query: { type: 'ABERTURA' | 'FECHAMENTO' }
  Response: { data: Checklist[] }

POST   /api/checklists
  Auth: GESTOR+
  Body: { titulo, descricao, tipo, horario, items }
  Response: { data: Checklist }

PATCH  /api/checklists/:id/items/:itemId
  Auth: anyone
  Body: { concluido, responsavel }
  Response: { data: ChecklistItem, message }
```

---

### **Operações** (`/api/operacao`)

```
GET    /api/operacao/equipamentos
  Query: { status, category, skip, take }
  Response: { data: Equipment[], total }

GET    /api/operacao/equipamentos/:id
  Response: { data: Equipment with maintenanceLogs }

POST   /api/operacao/equipamentos
  Auth: GESTOR+
  Body: { name, code, category, location, ... }
  Response: { data: Equipment }

PATCH  /api/operacao/equipamentos/:id
  Auth: GESTOR+
  Body: { status, location, nextMaintenanceAt, ... }
  Response: { data: Equipment }

POST   /api/operacao/equipamentos/:id/maintenance
  Auth: GESTOR+
  Body: { type, description, performedBy, cost }
  Response: { data: MaintenanceLog }
```

---

### **Financeiro** (`/api/financeiro`)

```
GET    /api/financeiro/snapshot
  Query: { month, year }
  Response: { data: FinancialSnapshot }

GET    /api/financeiro/receitas
  Query: { month, year, category }
  Response: { data: Revenue[], total }

GET    /api/financeiro/despesas
  Query: { month, year, status, category }
  Response: { data: Expense[], total }

POST   /api/financeiro/despesas
  Auth: GESTOR+
  Body: { description, category, amount, dueAt }
  Response: { data: Expense }

PATCH  /api/financeiro/despesas/:id
  Auth: GESTOR+
  Body: { status, paidAt, ... }
  Response: { data: Expense }
```

---

### **Comercial/Leads** (`/api/comercial`)

```
GET    /api/comercial/leads
  Query: { stage, temperature, ownerId, skip, take }
  Response: { data: Lead[], total }

GET    /api/comercial/leads/:id
  Response: { data: Lead with notes }

POST   /api/comercial/leads
  Auth: GESTOR+
  Body: { name, phone, email, stage, temperature, ownerId, estimatedValue }
  Response: { data: Lead }

PATCH  /api/comercial/leads/:id
  Auth: GESTOR+
  Body: { stage, temperature, nextFollowUpAt, ... }
  Response: { data: Lead }

POST   /api/comercial/leads/:id/notes
  Auth: anyone
  Body: { content }
  Response: { data: LeadNote }
```

---

### **Suporte** (`/api/suporte`)

```
GET    /api/suporte/tickets
  Query: { status, priority, skip, take }
  Response: { data: SupportTicket[], total }

POST   /api/suporte/tickets
  Auth: none (visitor form)
  Body: { subject, description, visitorName, visitorEmail, visitorPhone }
  Response: { data: SupportTicket, message }

POST   /api/suporte/tickets/:id/messages
  Auth: none (visitor) or admin (response)
  Body: { senderName, senderEmail, content }
  Response: { data: TicketMessage }

GET    /api/suporte/faq
  Response: { data: FAQ[] }
```

---

## 🔗 Integrações Externas

### **FoneNinja** (Vendas/Receitas)

**Flow:**
1. Backend consulta FoneNinja API diariamente
2. Cria/atualiza Revenue records
3. Recalcula FinancialSnapshot
4. Frontend exibe dados agregados

**Necessário:**
- API key do FoneNinja
- Endpoint: `/api/financeiro/sync/feneninja`
- Endpoint: `/api/financeiro/vendas` (GET)

**Estrutura de Retorno:**
```json
{
  "saleId": "string",
  "productName": "string",
  "value": 1000,
  "date": "2026-04-29"
}
```

---

### **Kommo CRM** (Leads)

**Flow:**
1. Backend sincroniza leads periodicamente
2. Cria/atualiza Lead records com kommoId
3. Frontend exibe pipeline

**Necessário:**
- Kommo API token
- Endpoint: `/api/comercial/sync/kommo`
- Endpoint: `/api/comercial/leads/kommo/:kommoId` (GET sync status)

---

### **Meu Assessor** (Despesas)

**Flow:**
1. Backend importa despesas mensalmente
2. Cria/atualiza Expense records
3. Recalcula FinancialSnapshot

**Necessário:**
- Meu Assessor API key
- Endpoint: `/api/financeiro/sync/meuassessor`

---

## 📊 Fluxos de Dados

### **Tarefa Completada → Gamificação**

```
1. User completa task (PATCH /api/tasks/:id com status='CONCLUIDA')
2. Backend:
   - Calcula "on-time" (completedAt <= dueAt)
   - Cria GamificationActivity
   - Adiciona pontos ao User.points
   - Verifica badges desbloqueadas
   - Retorna { task, points, badge? }
3. Frontend:
   - Exibe toast com pontos ganhos
   - Exibe modal de badge se desbloqueado
   - Atualiza leaderboard em tempo real
```

---

### **Dashboard Financeiro**

```
1. User acessa /financeiro
2. Frontend:
   - GET /api/financeiro/snapshot?month=4&year=2026
   - GET /api/financeiro/receitas?month=4&year=2026
   - GET /api/financeiro/despesas?month=4&year=2026
3. Backend:
   - Retorna dados agregados
   - Calcula totalizadores (totalRevenue, totalExpense, etc)
   - Inclui breakdown por categoria
4. Frontend:
   - Renderiza gráficos (Recharts)
   - Exibe tabelas de entrada/saída
   - Mostra KPIs (lucro bruto, lucro líquido, etc)
```

---

## 🔒 Considerações de Segurança

### **Autenticação & Autorização**

```
✅ Todos endpoints protegidos com JWT
✅ Validação de role (ADMIN, GESTOR, COLABORADOR)
✅ IDOR protection: usuários só acessam seus próprios dados
✅ Soft deletes para auditoria
```

### **Validação de Dados**

```
✅ Backend valida com Zod (schema igual ao frontend)
✅ Sanitização de strings (XSS protection)
✅ Limite de rate limiting por IP/user
```

### **Dados Sensíveis**

```
✅ Senhas hashed com Argon2id ou bcrypt
✅ Email nunca retornado em listagens públicas
✅ Tokens com expiração curta (15 min)
✅ Refresh tokens com expiração longa (7 dias)
```

---

## 📋 Checklist de Implementação

### **Fase 1: Banco de Dados (P0)**
- [ ] Expandir User model com gamificação
- [ ] Criar GamificationBadge, GamificationUserBadge, GamificationMonthlyStats
- [ ] Criar GamificationActivity
- [ ] Criar Task & ChecklistItem models
- [ ] Executar migrations

### **Fase 2: Endpoints Básicos (P0)**
- [ ] GET /api/users (com filtros)
- [ ] GET/POST /api/tasks
- [ ] GET /api/gamificacao/leaderboard
- [ ] GET /api/gamificacao/usuarios/:id/stats

### **Fase 3: Gamificação (P1)**
- [ ] Cálculo de pontos ao completar tarefas
- [ ] Desbloqueio automático de badges
- [ ] Atualização de leaderboard mensal

### **Fase 4: Integrações (P2)**
- [ ] FoneNinja sync `/api/financeiro/sync/feneninja`
- [ ] Kommo CRM sync `/api/comercial/sync/kommo`
- [ ] Meu Assessor sync `/api/financeiro/sync/meuassessor`

### **Fase 5: Dados Financeiros (P1)**
- [ ] Aggregação de receitas/despesas
- [ ] Cálculo de snapshots mensais
- [ ] Dashboard financeiro real

---

## 📞 Suporte & Comunicação

**Frontend Contact:**
- Email: guimi@atocreative.com
- Slack: #frontend-development

**Database Changes:**
- Sempre comunicar migrations com changelog
- Versionar schema mudanças
- Manter backward compatibility quando possível

---

**Status:** 🔄 Aguardando feedback e confirmação de prazos
**Próximo Passo:** Backend começa Fase 1 do checklist
