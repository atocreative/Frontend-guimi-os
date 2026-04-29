# Backend Guimi OS - Documentação de Endpoints da API

**Base URL:** `http://localhost:3001`

**Última atualização:** 2026-04-28

---

## 📋 Índice

1. [Health Check](#health-check)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Tarefas](#tarefas)
5. [Checklists](#checklists)
6. [Dashboard](#dashboard)
7. [Autenticação & Autorização](#autenticação--autorização)
8. [Status Codes](#status-codes)

---

## Health Check

### GET /health

Verifica o status da API.

**Autenticação:** Não requerida

**Resposta:** 200 OK
```json
{
  "status": "ok",
  "service": "backend-guimi-os",
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

---

## Autenticação

### POST /api/auth/login

Realiza login do usuário. Retorna um token JWT e um challenge para 2FA (se aplicável).

**Autenticação:** Não requerida

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123456"
}
```

**Validações:**
- `email`: Email válido
- `password`: Mínimo 8 caracteres

**Resposta:** 200 OK
```json
{
  "user": {
    "id": "uuid-do-usuario",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "COLABORADOR",
    "jobTitle": "Desenvolvedor"
  },
  "token": "jwt-token-aqui",
  "mfaRequired": true,
  "challengeToken": "challenge-token-para-2fa"
}
```

**Erro:** 401 Unauthorized
```json
{
  "error": "Credenciais inválidas"
}
```

---

### POST /api/auth/mfa/verify

Verifica o código 2FA (Time-based One-Time Password - TOTP).

**Autenticação:** Não requerida (mas `challengeToken` é necessário)

**Body:**
```json
{
  "challengeToken": "challenge-token-do-login",
  "code": "123456"
}
```

**Validações:**
- `challengeToken`: Token obrigatório
- `code`: Código com 6 dígitos numéricos

**Resposta:** 200 OK
```json
{
  "user": {
    "id": "uuid-do-usuario",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "ADMIN",
    "jobTitle": "Administrador"
  },
  "token": "jwt-token-autenticado"
}
```

**Erro:** 401 Unauthorized
```json
{
  "error": "Código 2FA inválido ou expirado"
}
```

---

## Usuários

### GET /api/users

Lista todos os usuários (com paginação e filtros).

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Todos (autenticados)

**Query Parameters:**
```
GET /api/users?active=true&orderBy=name
```

| Parâmetro | Tipo | Valores | Padrão | Descrição |
|-----------|------|--------|--------|-----------|
| `active` | string | `true`, `false` | - | Filtrar por usuários ativos |
| `orderBy` | string | `name`, `email`, `createdAt` | - | Campo para ordenação |

**Resposta:** 200 OK
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "COLABORADOR",
      "jobTitle": "Desenvolvedor",
      "active": true,
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-28T12:00:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Maria Santos",
      "email": "maria@example.com",
      "role": "GESTOR",
      "jobTitle": "Gerente de Projetos",
      "active": true,
      "createdAt": "2026-04-15T08:30:00Z",
      "updatedAt": "2026-04-27T15:45:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /api/users

Cria um novo usuário.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** ADMIN only

**Body:**
```json
{
  "name": "Novo Usuário",
  "email": "novo@example.com",
  "password": "senhaSegura123",
  "jobTitle": "Analista de Sistemas",
  "role": "COLABORADOR"
}
```

**Validações:**
- `name`: 1-255 caracteres (sanitizado)
- `email`: Email válido (normalizado)
- `password`: Mínimo 8 caracteres
- `jobTitle`: 1-255 caracteres (sanitizado)
- `role`: `ADMIN`, `GESTOR` ou `COLABORADOR`

**Resposta:** 201 Created
```json
{
  "id": "uuid-novo",
  "name": "Novo Usuário",
  "email": "novo@example.com",
  "jobTitle": "Analista de Sistemas",
  "role": "COLABORADOR",
  "active": true,
  "createdAt": "2026-04-28T12:00:00Z",
  "updatedAt": "2026-04-28T12:00:00Z"
}
```

**Erro:** 403 Forbidden (se não for ADMIN)
```json
{
  "error": "Acesso negado: apenas ADMIN pode criar usuários"
}
```

---

### GET /api/users/:id

Obtém dados de um usuário específico.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** O próprio usuário OU ADMIN

**Parâmetros da URL:**
- `:id` - UUID do usuário

**Resposta:** 200 OK
```json
{
  "id": "uuid-1",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "COLABORADOR",
  "jobTitle": "Desenvolvedor",
  "active": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T12:00:00Z"
}
```

**Erro:** 404 Not Found (se usuário não existe ou sem permissão)

---

### PATCH /api/users/:id

Atualiza dados de um usuário (exceto role).

**Autenticação:** JWT Token (obrigatório)

**Autorização:** O próprio usuário OU ADMIN

**Parâmetros da URL:**
- `:id` - UUID do usuário

**Body:**
```json
{
  "name": "João Silva Atualizado",
  "email": "novo-email@example.com",
  "jobTitle": "Desenvolvedor Senior"
}
```

**Validações:**
- `name`: 1-255 caracteres (opcional)
- `email`: Email válido (opcional)
- `jobTitle`: 1-255 caracteres (opcional)
- ⚠️ Campo `role` é ignorado silenciosamente (segurança)
- ⚠️ Campo `password` é ignorado (use endpoint específico se existir)

**Resposta:** 200 OK
```json
{
  "id": "uuid-1",
  "name": "João Silva Atualizado",
  "email": "novo-email@example.com",
  "role": "COLABORADOR",
  "jobTitle": "Desenvolvedor Senior",
  "active": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T13:00:00Z"
}
```

---

### PATCH /api/users/:id/role

Atualiza o role de um usuário.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** ADMIN only

**Parâmetros da URL:**
- `:id` - UUID do usuário

**Body:**
```json
{
  "role": "GESTOR"
}
```

**Validações:**
- `role`: `ADMIN`, `GESTOR` ou `COLABORADOR` (obrigatório)

**Resposta:** 200 OK
```json
{
  "id": "uuid-1",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "GESTOR",
  "jobTitle": "Desenvolvedor",
  "active": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T13:05:00Z"
}
```

---

### DELETE /api/users/:id

Deleta um usuário.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** ADMIN only

**Parâmetros da URL:**
- `:id` - UUID do usuário

**Resposta:** 204 No Content

**Erro:** 403 Forbidden (se não for ADMIN)

---

## Tarefas

### GET /api/tasks

Lista todas as tarefas (com filtros baseados em role).

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Todos (autenticados)

**Query Parameters:**
```
GET /api/tasks?status=EM_ANDAMENTO&assigneeId=uuid&orderBy=dueAt&sort=asc&limit=10
```

| Parâmetro | Tipo | Valores | Padrão | Descrição |
|-----------|------|--------|--------|-----------|
| `assigneeId` | string (UUID) | - | - | Filtrar por usuário atribuído |
| `status` | string | `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA` | - | Filtrar por status |
| `orderBy` | string | `createdAt`, `dueAt`, `priority`, `title` | - | Campo para ordenação |
| `sort` | string | `asc`, `desc` | `asc` | Direção da ordenação |
| `limit` | number | 1-100 | 20 | Quantidade máxima de resultados |

**Resposta:** 200 OK
```json
{
  "data": [
    {
      "id": "task-uuid-1",
      "title": "Implementar validação",
      "description": "Adicionar validação de entrada em todas as rotas",
      "status": "EM_ANDAMENTO",
      "priority": "ALTA",
      "dueAt": "2026-05-01T18:00:00Z",
      "horario": "14:30",
      "assigneeId": "user-uuid-1",
      "createdBy": "admin-uuid",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-28T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /api/tasks

Cria uma nova tarefa.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Todos (autenticados)

**Body:**
```json
{
  "title": "Implementar autorização",
  "description": "Adicionar guards de IDOR e privilege escalation",
  "priority": "ALTA",
  "dueAt": "2026-05-05T18:00:00Z",
  "horario": "14:30",
  "assigneeId": "user-uuid-2"
}
```

**Validações:**
- `title`: 1-255 caracteres (obrigatório, sanitizado)
- `description`: até 1000 caracteres (opcional, sanitizado)
- `priority`: `ALTA`, `MEDIA`, `BAIXA` (opcional)
- `dueAt`: Data ISO 8601 (opcional)
- `horario`: Formato HH:MM (opcional)
- `assigneeId`: UUID válido (opcional)

**Resposta:** 201 Created
```json
{
  "id": "task-uuid-novo",
  "title": "Implementar autorização",
  "description": "Adicionar guards de IDOR e privilege escalation",
  "status": "PENDENTE",
  "priority": "ALTA",
  "dueAt": "2026-05-05T18:00:00Z",
  "horario": "14:30",
  "assigneeId": "user-uuid-2",
  "createdBy": "user-uuid-atual",
  "createdAt": "2026-04-28T12:00:00Z",
  "updatedAt": "2026-04-28T12:00:00Z"
}
```

---

### GET /api/tasks/:id

Obtém dados de uma tarefa específica.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Criador da tarefa OU ADMIN

**Parâmetros da URL:**
- `:id` - UUID da tarefa

**Resposta:** 200 OK
```json
{
  "id": "task-uuid-1",
  "title": "Implementar validação",
  "description": "Adicionar validação de entrada em todas as rotas",
  "status": "EM_ANDAMENTO",
  "priority": "ALTA",
  "dueAt": "2026-05-01T18:00:00Z",
  "horario": "14:30",
  "assigneeId": "user-uuid-1",
  "createdBy": "admin-uuid",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T12:00:00Z"
}
```

**Erro:** 404 Not Found (se tarefa não existe ou sem permissão)

---

### PATCH /api/tasks/:id

Atualiza uma tarefa.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Criador da tarefa OU ADMIN

**Parâmetros da URL:**
- `:id` - UUID da tarefa

**Body:**
```json
{
  "title": "Implementar validação (atualizado)",
  "status": "CONCLUIDA",
  "priority": "MEDIA",
  "description": "Descrição atualizada",
  "dueAt": "2026-05-02T18:00:00Z",
  "horario": "15:00",
  "assigneeId": "user-uuid-3"
}
```

**Validações:**
- Todos os campos são opcionais
- ⚠️ Campos `createdBy` e `createdAt` são ignorados silenciosamente
- ⚠️ COLABORADOR não pode mudar `assigneeId` (será ignorado)

**Resposta:** 200 OK
```json
{
  "id": "task-uuid-1",
  "title": "Implementar validação (atualizado)",
  "description": "Descrição atualizada",
  "status": "CONCLUIDA",
  "priority": "MEDIA",
  "dueAt": "2026-05-02T18:00:00Z",
  "horario": "15:00",
  "assigneeId": "user-uuid-3",
  "createdBy": "admin-uuid",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T13:00:00Z"
}
```

---

### DELETE /api/tasks/:id

Deleta uma tarefa.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Criador da tarefa OU ADMIN

**Parâmetros da URL:**
- `:id` - UUID da tarefa

**Resposta:** 204 No Content

---

## Checklists

### GET /api/checklists

Lista todos os checklists com seus itens.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Todos (autenticados)

**Query Parameters:**
```
GET /api/checklists?tipo=ABERTURA
```

| Parâmetro | Tipo | Valores | Descrição |
|-----------|------|--------|-----------|
| `tipo` | string | `ABERTURA`, `FECHAMENTO` | Filtrar por tipo de checklist |

**Resposta:** 200 OK
```json
{
  "data": [
    {
      "id": "checklist-uuid-1",
      "title": "Checklist de Abertura",
      "description": "Itens para verificar na abertura",
      "tipo": "ABERTURA",
      "color": "#FF5733",
      "items": [
        {
          "id": "item-uuid-1",
          "title": "Verificar servidor",
          "description": "Confira se o servidor está online",
          "completed": true,
          "createdAt": "2026-04-20T10:00:00Z"
        },
        {
          "id": "item-uuid-2",
          "title": "Validar logs",
          "description": "Revise os logs de erro",
          "completed": false,
          "createdAt": "2026-04-20T10:05:00Z"
        }
      ],
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-28T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### PATCH /api/checklists/:id

Alterna (toggle) o status de um item do checklist.

**Autenticação:** JWT Token (obrigatório)

**Autorização:** Todos (autenticados)

**Parâmetros da URL:**
- `:id` - UUID do item do checklist

**Body:**
```json
{
  "completed": true
}
```

**Validações:**
- `completed`: Booleano (obrigatório)

**Resposta:** 200 OK
```json
{
  "id": "item-uuid-1",
  "title": "Verificar servidor",
  "description": "Confira se o servidor está online",
  "completed": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-28T13:00:00Z"
}
```

---

## Dashboard

### GET /dashboard

Obtém dados consolidados do dashboard (público, sem autenticação).

**Autenticação:** Não requerida

**Resposta:** 200 OK
```json
{
  "systemStatus": "operational",
  "metrics": {
    "totalUsers": 15,
    "totalTasks": 42,
    "totalChecklists": 8,
    "activeUsers": 10,
    "tasksInProgress": 12,
    "completedTasks": 20
  },
  "recentActivity": {
    "lastTaskCreated": "2026-04-28T13:00:00Z",
    "lastUserCreated": "2026-04-27T10:00:00Z"
  },
  "timestamp": "2026-04-28T13:05:00Z"
}
```

---

## Autenticação & Autorização

### 🔐 Como Autenticar

1. **Fazer Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "senhaSegura123"
     }'
   ```

2. **Verificar 2FA (se retornar `mfaRequired: true`):**
   ```bash
   curl -X POST http://localhost:3001/api/auth/mfa/verify \
     -H "Content-Type: application/json" \
     -d '{
       "challengeToken": "token-do-login",
       "code": "123456"
     }'
   ```

3. **Usar o Token JWT:**
   ```bash
   curl -X GET http://localhost:3001/api/users \
     -H "Authorization: Bearer jwt-token-aqui"
   ```

### 👥 Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|-----------|
| **ADMIN** | Administrador | Acesso total a todos os recursos, CRUD completo |
| **GESTOR** | Gerente | Acesso a recursos próprios, visualização de recursos de COLABORADOR |
| **COLABORADOR** | Colaborador | Acesso apenas aos próprios recursos |

### 🔒 Proteção contra Ataques

- **IDOR (Insecure Direct Object Reference):** Endpoints com `:id` validam ownership/role
- **Privilege Escalation:** Campo `role` é ignorado em PATCH de usuário (exceto por ADMIN via endpoint específico)
- **XSS:** Input sanitizado em todos os campos de texto
- **SQLi:** Prepared statements + validação com Zod
- **2FA/TOTP:** Autenticação de dois fatores em login
- **Password Hashing:** Senhas com Argon2id

---

## Status Codes

| Código | Significado | Quando ocorre |
|--------|-----------|---------------|
| **200** | OK | Requisição bem-sucedida (GET, PATCH) |
| **201** | Created | Recurso criado com sucesso (POST) |
| **204** | No Content | Recurso deletado com sucesso (DELETE) |
| **400** | Bad Request | Validação falhou (dados inválidos) |
| **401** | Unauthorized | Sem autenticação ou token inválido |
| **403** | Forbidden | Autenticado, mas sem permissão para ação |
| **404** | Not Found | Recurso não existe OU sem permissão para acessar |
| **500** | Internal Server Error | Erro no servidor |

---

## 📝 Exemplos Completos

### Exemplo 1: Login e listar usuários

```bash
# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "senhaAdmin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Verificar 2FA (se necessário)
CHALLENGE=$(echo $LOGIN_RESPONSE | grep -o '"challengeToken":"[^"]*' | cut -d'"' -f4)
curl -X POST http://localhost:3001/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeToken": "'$CHALLENGE'",
    "code": "123456"
  }'

# 3. Listar usuários
curl -X GET "http://localhost:3001/api/users?orderBy=name" \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 2: Criar uma tarefa

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token-aqui" \
  -d '{
    "title": "Nova Tarefa",
    "description": "Descrição da tarefa",
    "priority": "ALTA",
    "dueAt": "2026-05-10T18:00:00Z",
    "horario": "14:30"
  }'
```

### Exemplo 3: Atualizar próprio perfil

```bash
curl -X PATCH http://localhost:3001/api/users/seu-user-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token-aqui" \
  -d '{
    "name": "Seu Novo Nome",
    "jobTitle": "Desenvolvedor Senior"
  }'
```

---

## 🚀 Observações Importantes

1. **Sensibilidade de Maiúsculas:** Enums (role, status, priority, tipo) são case-sensitive
2. **Datas em ISO 8601:** Sempre use formato `YYYY-MM-DDTHH:mm:ssZ`
3. **UUIDs:** IDs de usuários, tarefas e checklists são UUIDs v4
4. **Rate Limiting:** Não implementado na v1.0 (considerar para v2.0)
5. **CORS:** Frontend deve incluir headers apropriados
6. **Erro de Validação:** Retorna campos específicos e mensagens detalhadas

---

**Desenvolvido com ❤️ para o Guimi OS**
