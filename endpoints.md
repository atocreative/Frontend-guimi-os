# 📚 ENDPOINTS COMPLETOS - Backend API

## 🔐 AUTENTICAÇÃO

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@guimicell.com",
  "password": "Admin@12345",
  "captchaAnswer": "5",
  "captchaToken": "eyJ..."
}

Response 200:
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "admin@guimicell.com",
      "role": "ADMIN",
      "isSuperUser": true
    }
  }
}
```

### Get CAPTCHA
```
GET /api/auth/captcha

Response 200:
{
  "data": {
    "token": "eyJ...",
    "question": "Quanto é 5 + 3?",
    "expiresIn": 300
  }
}
```

### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

---

## 💰 DASHBOARD & FINANCEIRO

### Dashboard (Dados Financeiros)
```
GET /api/dashboard
Authorization: (OPCIONAL - público)

Response 200:
{
  "financeiro": {
    "receita": 15000,
    "despesasVariaveis": 3500,
    "fixedExpensesTotal": 7300,
    "grossProfit": 11500,
    "netProfit": 4200,
    "expenseFixed": [
      {
        "id": "...",
        "description": "Aluguel Escritório",
        "amount": "2000.00"
      }
    ],
    "payload": {...}
  },
  "updatedAt": "2026-05-01T12:00:00Z"
}
```

### Financeiro Snapshot Mensal
```
GET /api/financeiro/snapshot?month=5&year=2026
Authorization: Bearer TOKEN (OPCIONAL)

Response 200:
{
  "data": {
    "totalRevenue": 15000,
    "totalExpense": 3500,
    "grossProfit": 11500,
    "netProfit": 8000,
    "revenueByCategory": {...},
    "expenseByCategory": {...}
  }
}
```

### Sync FoneNinja (Popular dados)
```
POST /api/financeiro/sync/feneninja
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "startDate": "2026-05-01",
  "endDate": "2026-05-31"
}

Response 200:
{
  "data": {
    "synced": true,
    "itemCount": 45,
    "revenues": 15000,
    "expenses": 3500
  }
}
```

---

## 📝 TAREFAS

### Listar Tarefas
```
GET /api/tarefas?status=PENDENTE&limit=20&skip=0
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "task-001",
      "title": "Revisar relatório",
      "description": "Analisar dados",
      "status": "PENDENTE",
      "priority": "ALTA",
      "dueAt": "2026-05-05T14:00:00Z",
      "horario": "14:00",
      "assignee": {
        "id": "user-001",
        "name": "Admin User",
        "role": "ADMIN"
      }
    }
  ],
  "total": 1
}
```

### Criar Tarefa
```
POST /api/tarefas
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Nova tarefa",
  "description": "Descrição opcional",
  "priority": "ALTA",
  "dueAt": "2026-05-05",
  "horario": "14:00"
}

Response 201:
{
  "data": {
    "id": "task-001",
    "title": "Nova tarefa",
    "status": "PENDENTE",
    "createdAt": "2026-05-01T10:00:00Z"
  }
}
```

### Atualizar Tarefa
```
PATCH /api/tarefas/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Título atualizado",
  "status": "EM_ANDAMENTO",
  "priority": "MEDIA"
}

Response 200:
{
  "data": {...}
}
```

### Completar Tarefa
```
POST /api/tarefas/:id/complete
Authorization: Bearer TOKEN

Response 200:
{
  "data": {
    "id": "task-001",
    "status": "CONCLUIDA"
  }
}
```

### Deletar Tarefa
```
DELETE /api/tarefas/:id
Authorization: Bearer TOKEN

Response 200:
{
  "data": { "success": true }
}
```

---

## 👥 USUÁRIOS

### Listar Usuários
```
GET /api/users?role=ADMIN&active=true&limit=20
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "user-001",
      "name": "Admin User",
      "email": "admin@guimicell.com",
      "role": "ADMIN",
      "isSuperUser": true,
      "active": true,
      "jobTitle": "Administrador"
    }
  ],
  "total": 1
}
```

### Criar Usuário
```
POST /api/users
Authorization: Bearer TOKEN (ADMIN)
Content-Type: application/json

{
  "name": "Novo User",
  "email": "novo@guimicell.com",
  "password": "SenhaForte@123",
  "role": "COLABORADOR",
  "jobTitle": "Operacional"
}

Response 201:
{
  "data": {
    "id": "user-002",
    "email": "novo@guimicell.com",
    "role": "COLABORADOR"
  }
}
```

### Atualizar Usuário
```
PATCH /api/users/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Nome atualizado",
  "jobTitle": "Novo cargo"
}

Response 200:
{
  "data": {...}
}
```

### Deletar Usuário
```
DELETE /api/users/:id
Authorization: Bearer TOKEN (ADMIN)

Response 200:
{
  "data": { "success": true }
}
```

---

## 📋 CHECKLISTS

### Listar Checklists
```
GET /api/checklists?tipo=ABERTURA
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "checklist-001",
      "titulo": "Abertura da Loja",
      "tipo": "ABERTURA",
      "itens": [...]
    }
  ]
}
```

### Criar Checklist
```
POST /api/checklists
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "titulo": "Nova checklist",
  "tipo": "ABERTURA",
  "itens": [
    {
      "titulo": "Item 1",
      "descricao": "Descrição"
    }
  ]
}

Response 201:
{
  "data": {...}
}
```

### Atualizar Item Checklist
```
PATCH /api/checklists/:id/items/:itemId
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "concluido": true
}

Response 200:
{
  "data": {...}
}
```

---

## ⚙️ DEV MENU

### Listar Menu
```
GET /api/dev-menu
Authorization: Bearer TOKEN (OPCIONAL)

Response 200:
{
  "data": [
    {
      "key": "analytics",
      "label": "Dashboard Analytics",
      "enabled": false,
      "pending": false
    }
  ]
}
```

### Atualizar Menu Item
```
PUT /api/dev-menu/:key
Authorization: Bearer TOKEN (ADMIN)
Content-Type: application/json

{
  "enabled": true,
  "pending": false
}

Response 200:
{
  "data": {...}
}
```

---

## 💸 DESPESAS FIXAS

### Listar Despesas Fixas
```
GET /api/expense-fixed
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "exp-001",
      "description": "Aluguel Escritório",
      "amount": "2000.00"
    }
  ]
}
```

### Criar Despesa Fixa
```
POST /api/expense-fixed
Authorization: Bearer TOKEN (ADMIN)
Content-Type: application/json

{
  "description": "Nova despesa",
  "amount": 1000
}

Response 201:
{
  "data": {...}
}
```

### Atualizar Despesa Fixa
```
PATCH /api/expense-fixed/:id
Authorization: Bearer TOKEN (ADMIN)
Content-Type: application/json

{
  "amount": 2500
}

Response 200:
{
  "data": {...}
}
```

### Deletar Despesa Fixa
```
DELETE /api/expense-fixed/:id
Authorization: Bearer TOKEN (ADMIN)

Response 200:
{
  "data": { "success": true }
}
```

---

## 🏥 HEALTH CHECK

```
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": "2026-05-01T10:00:00Z"
}
```

---

## 🔑 NOTAS IMPORTANTES

- **Token**: Adicione header `Authorization: Bearer TOKEN`
- **CORS**: Habilitado para `http://localhost:3000`
- **/dashboard**: Público (sem auth necessária)
- **/api/tarefas**: Aliases para /api/tasks
- Senhas: Mínimo 8 caracteres
- Todos os timestamps em UTC

