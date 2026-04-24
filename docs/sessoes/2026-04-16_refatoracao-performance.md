# Sessao 2026-04-16 — Refatoracao de Performance

## Problema
O sistema apresentava excesso de requisicoes no terminal `npm run dev`, causando restarts frequentes. Inviavel para uso em operacao empresarial.

## Diagnostico
Analise completa identificou ~20 problemas de performance:
- Prisma recriava adapter PG a cada HMR (causa principal dos restarts)
- `auth()` chamado 2-3x por navegacao (middleware + layout + page)
- Zero `loading.tsx` — paginas travavam ate carregar tudo do servidor
- Refetch completo de todas as tarefas apos criar/editar/deletar uma unica
- Falta de memoizacao em componentes criticos (ColunaPessoa, filtros, sidebar)
- Fetch duplicado de `/api/usuarios` em componentes independentes

## O que foi feito

### 1. Prisma Connection Pool (`lib/prisma.ts`)
- Adapter PG agora cacheado no `globalThis` junto com o client
- Evita criacao de novas conexoes a cada hot reload

### 2. Auth deduplicado (`lib/auth-session.ts`)
- Novo helper `getSession()` usando `React.cache()` — deduplica chamadas dentro do mesmo request
- Atualizado em: dashboard layout, dashboard page, todas as API routes (`/api/tarefas`, `/api/tarefas/[id]`, `/api/usuarios`)

### 3. Loading boundaries (Suspense/Streaming)
- Criados `loading.tsx` para: `/`, `/agenda`, `/colaboradores`, `/configuracoes`
- Skeleton exibido imediatamente enquanto dados carregam

### 4. AgendaPage — Updates otimistas
- `onCriada` agora recebe a tarefa criada e adiciona direto no state (antes: refazia GET de tudo)
- `handleDelete` restaura tarefa no state se DELETE falhar (antes: refazia GET de tudo)
- Todos os calculos derivados agora usam `useMemo` (resumo, tarefasOrdenadas, usuariosFiltrados, tarefasPorUsuario)
- `.filter()` por usuario pre-computado uma vez em `tarefasPorUsuario` Map

### 5. ColunaPessoa memoizada (`components/agenda/coluna-pessoa.tsx`)
- Envolvida com `React.memo` + `useMemo` interno para sort e contagem

### 6. Dashboard Admin/Colaborador
- `pendentesVisiveis` e `hojeVisiveis` agora usam `useMemo`

### 7. Sidebar (`components/layout/app-sidebar.tsx`)
- `filteredNav` memoizado com `React.useMemo` (dependencia: `userRole`, que nao muda na sessao)

### 8. Middleware (`middleware.ts`)
- Adicionado `_next/data` ao matcher para excluir prefetch requests

### 9. ModalNovaTarefa (`components/agenda/modal-nova-tarefa.tsx`)
- `onCriada` agora retorna a tarefa criada pelo POST ao inves de disparar refetch

## Arquivos alterados
- `lib/prisma.ts` — singleton com adapter cacheado
- `lib/auth-session.ts` — **novo** — helper `getSession()` com `React.cache()`
- `app/(dashboard)/layout.tsx` — usa `getSession()`
- `app/(dashboard)/page.tsx` — usa `getSession()`
- `app/(dashboard)/loading.tsx` — **novo**
- `app/(dashboard)/agenda/loading.tsx` — **novo**
- `app/(dashboard)/agenda/page.tsx` — useMemo, optimistic updates, tarefasPorUsuario
- `app/(dashboard)/colaboradores/loading.tsx` — **novo**
- `app/(dashboard)/configuracoes/loading.tsx` — **novo**
- `app/api/tarefas/route.ts` — usa `getSession()`
- `app/api/tarefas/[id]/route.ts` — usa `getSession()`
- `app/api/usuarios/route.ts` — usa `getSession()`
- `components/agenda/coluna-pessoa.tsx` — React.memo + useMemo
- `components/agenda/modal-nova-tarefa.tsx` — onCriada retorna tarefa
- `components/dashboard/dashboard-admin.tsx` — useMemo nos filtros
- `components/dashboard/dashboard-colaborador.tsx` — useMemo nos filtros
- `components/layout/app-sidebar.tsx` — useMemo no filteredNav
- `middleware.ts` — matcher expandido

## Pendencias
- Falta `loading.tsx` para rotas restantes (comercial, financeiro, operacao, indicadores, processos)
- ColaboradoresClient e UsuariosSection fazem fetch duplicado de `/api/usuarios` — candidato a zustand store compartilhado
- API routes sem Cache-Control headers (candidato a implementar para GET)
- Middleware depreciado no Next.js 16 — migrar para `proxy` convention quando estabilizar
