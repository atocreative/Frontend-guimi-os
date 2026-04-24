# Sessão: Organização de estrutura e criação do fluxo /salve

**Data:** 2026-04-16

## O que foi feito

- **Varredura geral do projeto** — identificados arquivos .md avulsos que estavam sendo criados por sessões anteriores do Claude Code (planos, notas, análises) espalhados pelo repositório
- **Limpeza** — usuário já havia apagado a maioria dos .md manualmente. Removemos a pasta `scratch/` que estava vazia
- **Arquivos .md legítimos mantidos:** `README.md`, `AGENTS.md` (Next.js), `.agents/skills/.../SKILL.md` (skill do Supabase)
- **Criação do fluxo `/salve`** — sistema de checkpoint controlado para documentar sessões de trabalho

## Decisões tomadas

- Documentação de sessão fica em `docs/sessoes/YYYY-MM-DD_topico.md`
- Arquivos .md só são criados via `/salve`, nunca de forma avulsa
- Cada chat novo é tratado como uma sessão isolada (novo dev), e o contexto vem da leitura de `docs/sessoes/`

## Arquivos alterados/criados

- `docs/sessoes/` — pasta criada
- Memória do Claude atualizada com o fluxo `/salve`

## Pendências

- Nenhuma — sessão foi apenas de organização e definição de workflow
