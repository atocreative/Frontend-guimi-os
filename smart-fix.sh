#!/bin/bash

TASK="$1"

echo "=== SCOUT (HAIKU) ==="

claude 
--model claude-3-haiku 
--append-system-prompt "$(cat .ai/agents/scout.md)" 
"$TASK

Save result to .ai/handoffs/scout.md"

echo "=== PLANNER (OPUS) ==="

claude 
--model claude-opus 
--append-system-prompt "$(cat .ai/agents/planner.md)" 
"Read .ai/handoffs/scout.md

Create execution plan.
Save to .ai/handoffs/plan.md"

echo "=== EXECUTOR (SONNET) ==="

claude 
--model claude-sonnet-4-6 
--append-system-prompt "$(cat .ai/agents/executor.md)" 
"Read .ai/handoffs/plan.md

Implement exactly the planned patches."
