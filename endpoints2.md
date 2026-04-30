# Endpoints Ativos do Projeto + Integração FoneNinja

**Base URL local do backend:** `http://localhost:3001`

Este arquivo documenta o **estado atual real** dos endpoints ativos do projeto, com foco especial nos endpoints da integração FoneNinja que o backend usa hoje para autenticar e puxar dados.

---

## 1. Health e descoberta

### `GET /health`
Retorna status simples da API.

### `GET /api`
Retorna lista resumida dos endpoints expostos pelo backend.

---

## 2. Autenticação interna do projeto

### `GET /api/auth/captcha`
Retorna um desafio matemático para o login.

**Resposta:**
```json
{
  "data": {
    "token": "captcha-jwt",
    "question": "Quanto é 4 + 7?",
    "expiresIn": 300
  }
}
```

### `POST /api/auth/login`
Login do usuário do sistema.

**Body esperado:**
```json
{
  "email": "admin@guimicell.com",
  "password": "atoadm2026",
  "captchaAnswer": "11",
  "captchaToken": "..."
}
```

**Compatibilidade temporária:**
Também aceita `captchaSeed` legado.

**Resposta:**
```json
{
  "data": {
    "accessToken": "jwt",
    "refreshToken": "refresh-token",
    "expiresIn": "8h",
    "user": {
      "id": "...",
      "name": "Admin Developer",
      "email": "admin@guimicell.com",
      "role": "SUPER_USER",
      "active": true,
      "jobTitle": "Super User",
      "phone": null,
      "avatarUrl": null,
      "level": 1,
      "points": 0,
      "temperature": "FRIO",
      "lastActivityAt": "..."
    }
  }
}
```

### `POST /api/auth/refresh`
Renova `accessToken` e `refreshToken`.

**Body:**
```json
{
  "refreshToken": "..."
}
```

### `POST /api/auth/logout`
Revoga a sessão via refresh token.

**Body opcional:**
```json
{
  "refreshToken": "..."
}
```

---

## 3. Usuários

### `GET /api/users`
Query suportada:
- `active=true|false`
- `role=SUPER_USER|ADMIN|GESTOR|COLABORADOR`
- `orderBy=name|email|createdAt|points|level`
- `sort=asc|desc`
- `skip`
- `take`

**Resposta:**
```json
{
  "data": [],
  "total": 0,
  "meta": {
    "skip": 0,
    "take": 20,
    "hasMore": false
  }
}
```

### `POST /api/users`
Cria usuário.

**Auth:** `SUPER_USER` ou `ADMIN`

### `GET /api/users/:id`
Busca usuário por id.

### `PATCH /api/users/:id`
Atualiza perfil.

### `PATCH /api/users/:id/role`
Atualiza role.

**Auth:** `SUPER_USER` ou `ADMIN`

### `PATCH /api/users/:id/password`
Atualiza senha do usuário.

### `DELETE /api/users/:id`
Soft delete do usuário.

**Auth:** `SUPER_USER` ou `ADMIN`

---

## 4. Tarefas

### `GET /api/tasks`
Query suportada:
- `assigneeId`
- `status=PENDENTE|EM_ANDAMENTO|CONCLUIDA|CANCELADA`
- `priority=ALTA|MEDIA|BAIXA`
- `orderBy=createdAt|dueAt|priority|title|updatedAt`
- `sort=asc|desc`
- `limit`
- `skip`
- `take`
- `dueAt`

### `POST /api/tasks`
Cria tarefa.

### `GET /api/tasks/:id`
Detalhe de tarefa com checklist.

### `PATCH /api/tasks/:id`
Atualiza tarefa.

Se a tarefa mudar para `CONCLUIDA`, pode retornar:
- `points`
- `leveledUp`
- `badgeUnlocked`
- `gamification`

### `POST /api/tasks/:id/complete`
Completa tarefa explicitamente.

### `DELETE /api/tasks/:id`
Soft delete.

---

## 5. Checklists

### `GET /api/checklists`
Query suportada:
- `tipo=ABERTURA|FECHAMENTO`
- `taskId`
- `skip`
- `take`

### `POST /api/checklists`
Cria item de checklist.

### `PATCH /api/checklists/:id`
Atualiza item diretamente.

### `PATCH /api/checklists/:id/items/:itemId`
Atualiza item no formato esperado pelo frontend.

---

## 6. Gamificação

### `GET /api/gamificacao/leaderboard`
Query suportada:
- `month`
- `year`
- `scope=month|all`

### `GET /api/gamificacao/usuarios/:id/stats`
Estatísticas completas do usuário.

### `GET /api/gamificacao/badges`
Catálogo de badges.

---

## 7. Operação

### `GET /api/operacao/equipamentos`
Query suportada:
- `status=ATIVO|INATIVO|EM_MANUTENCAO|DESCARTADO`
- `category`
- `skip`
- `take`

### `GET /api/operacao/equipamentos/:id`
Detalhe de equipamento.

### `POST /api/operacao/equipamentos`
### `PATCH /api/operacao/equipamentos/:id`
### `POST /api/operacao/equipamentos/:id/maintenance`

**Auth de escrita:** `SUPER_USER`, `ADMIN` ou `GESTOR`

---

## 8. Financeiro

### `GET /api/financeiro/snapshot`
Query obrigatória:
- `month`
- `year`

### `GET /api/financeiro/receitas`
Query suportada:
- `month`
- `year`
- `category`

### `GET /api/financeiro/despesas`
Query suportada:
- `month`
- `year`
- `status=PENDENTE|PAGO|CANCELADO`
- `category`

### `POST /api/financeiro/despesas`
### `PATCH /api/financeiro/despesas/:id`

**Auth de escrita:** `SUPER_USER`, `ADMIN` ou `GESTOR`

### Syncs expostos
#### `POST /api/financeiro/sync/feneninja`
Dispara sincronização de receitas com base nos dados puxados do FoneNinja.

#### `POST /api/financeiro/sync/meuassessor`
Stub atual preparado para integração futura.

---

## 9. Comercial

### `GET /api/comercial/leads`
Query suportada:
- `stage=PROSPECTIVA|QUALIFICACAO|PROPOSTA|NEGOZIACAO|FECHAMENTO|OPORTUNIDADE_PERDIDA`
- `ownerId`
- `temperature=QUENTE|MORNO|FRIO`
- `skip`
- `take`

### `GET /api/comercial/leads/:id`
### `POST /api/comercial/leads`
### `PATCH /api/comercial/leads/:id`
### `POST /api/comercial/leads/:id/notes`

### Kommo
#### `POST /api/comercial/sync/kommo`
Stub atual preparado para integração futura.

#### `GET /api/comercial/leads/kommo/:kommoId`
Consulta status local de lead sincronizado por `kommoId`.

---

## 10. Suporte

### `GET /api/suporte/tickets`
Query suportada:
- `status=ABERTO|EM_ANDAMENTO|AGUARDANDO_RESPOSTA|RESOLVIDO|FECHADO`
- `priority=ALTA|MEDIA|BAIXA`
- `assignedTo`

### `GET /api/suporte/tickets/:id`
### `POST /api/suporte/tickets`
### `PATCH /api/suporte/tickets/:id`
### `POST /api/suporte/tickets/:id/messages`

### FAQ
#### `GET /api/suporte/faq`
#### `GET /api/suporte/faqs`
Ambos retornam a mesma listagem ativa.

#### `POST /api/suporte/faqs`
#### `PATCH /api/suporte/faqs/:id`

---

# 11. Integração FoneNinja — endpoints upstream usados hoje

O frontend **não deve chamar o FoneNinja diretamente**. O correto é consumir o backend local, que por sua vez autentica e consulta o FoneNinja.

## Base URL upstream configurada
Vem de:
- `FONENINJA_BASE_URL`

Fallback atual no backend:
- `https://api.fone.ninja`

## Login candidates que o backend testa
Arquivo:
- `src/services/auth.service.js`

O backend tenta autenticar contra estes caminhos, nessa ordem:

1. `POST /auth/api/suporte/login`
   - body: `{ email, password }`
2. `POST /auth/api/login`
   - body: `{ email, password }`
3. `POST /auth/api/auth/login`
   - body: `{ email, password }`
4. `POST /auth/api/suporte/login`
   - body: `{ login, password }`
5. `POST /auth/api/login`
   - body: `{ login, password }`

Headers usados no login:
- `Accept: application/json`
- `Content-Type: application/json`
- `Accept-Language`
- `Origin`
- `Referer`
- `X-Requested-With`

## Endpoint de resolução de loja
Arquivo:
- `src/services/store-context.service.js`

Usa:
- `GET {FONENINJA_STORE_RESOLVE_PATH}`

Retorna/descobre `lojaId` a partir do payload.

## Endpoints upstream usados para dados
Arquivo:
- `src/services/foneninja-endpoints.service.js`

Todos usam o token obtido no login e `Authorization: Bearer <token>`.

### Produtos
Path configurado ou fallback:
- `FONENINJA_PRODUCTS_PATH`
- fallback: `/erp/api/lojas/{lojaId}/produtos`

Função:
- `getProdutos()`

### Vendas
Path configurado ou fallback:
- `FONENINJA_SALES_PATH`
- fallback: `/erp/api/lojas/{lojaId}/vendas`

Função:
- `getVendas()`

### Estoque
Path configurado ou fallback:
- `FONENINJA_STOCK_PATH`
- fallback: `/erp/api/lojas/{lojaId}/refactored-estoque`

Função:
- `getEstoque()`

### Financeiro
Path configurado ou fallback:
- `FONENINJA_FINANCE_PATH`
- fallback: `/erp/api/lojas/{lojaId}/financeiro/refactored-contas`

Função:
- `getFinanceiro()`

### Movimentações
Path configurado ou fallback:
- `FONENINJA_MOVIMENTACOES_PATH`
- fallback: `/erp/api/lojas/{lojaId}/movimentacoes`

Função:
- `getMovimentacoes()`

---

# 12. Como o frontend deve consumir dados FoneNinja corretamente

## Regra correta
O frontend deve consumir **o backend local**, não o upstream do FoneNinja.

### Para dashboard/resumo
Consumir:
- `GET /dashboard`

O backend já agrega:
- `produtos`
- `vendas`
- `estoque`
- `financeiroExterno`
- `movimentacoes`
- `summary`

### Para sincronização de receitas FoneNinja
Consumir:
- `POST /api/financeiro/sync/feneninja`

### Para validar se a integração FoneNinja está ativa
Validar:
1. backend responde em `GET /health`
2. backend responde em `GET /dashboard`
3. `POST /api/financeiro/sync/feneninja` não retorna erro 500/502
4. se falhar, inspecionar as variáveis:
   - `FONENINJA_BASE_URL`
   - `FONENINJA_EMAIL`
   - `FONENINJA_PASSWORD`
   - `FONENINJA_STORE_RESOLVE_PATH`
   - `FONENINJA_PRODUCTS_PATH`
   - `FONENINJA_SALES_PATH`
   - `FONENINJA_STOCK_PATH`
   - `FONENINJA_FINANCE_PATH`
   - `FONENINJA_MOVIMENTACOES_PATH`

---

# 13. Observações importantes para o frontend

1. O contrato antigo em `endpoints.md` está desatualizado para auth/MFA.
2. O contrato correto hoje está neste `endpoints2.md`.
3. O backend já usa cache interno de token FoneNinja.
4. O frontend não precisa reproduzir o login do FoneNinja.
5. O frontend deve considerar que o backend pode testar múltiplos caminhos de login upstream automaticamente.

---

# 14. Endpoint prioritário para o frontend testar agora

Se o objetivo é confirmar que o FoneNinja está realmente integrado e que os dados podem ser consumidos, testar nesta ordem:

1. `GET /health`
2. `GET /api`
3. `GET /dashboard`
4. `POST /api/financeiro/sync/feneninja`
5. `GET /api/financeiro/receitas?month=4&year=2026`

Se esses 5 funcionarem, a cadeia backend + FoneNinja está operacional do ponto de vista do frontend.
