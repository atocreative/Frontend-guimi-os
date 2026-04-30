# Atualização de Credenciais nos Testes

## Status

Os seguintes arquivos de teste ainda usam credenciais **ERRADAS**:

```
❌ tests/debug-login.spec.ts
❌ tests/e2e/audit.spec.ts
❌ tests/e2e/debug-login.spec.ts
❌ tests/e2e/debug-login2.spec.ts
❌ tests/e2e/login-complete.spec.ts
❌ tests/e2e/login-debug2.spec.ts
❌ tests/smoke.spec.ts
```

## Credenciais Corretas

```
Email: admin@guimicell.com
Senha: atoadm2026 (OU 12345678)
```

## Como Corrigir

### Opção 1: Bulk Replace (Recomendado)

```bash
# Substituir todas as ocorrências em todos os testes
find tests -name "*.spec.ts" -type f -exec sed -i 's/admin@aguimicell\.com/admin@guimicell.com/g' {} \;

# Opcional: Se quiser uma senha específica
find tests -name "*.spec.ts" -type f -exec sed -i 's/"aguimicell123"/"atoadm2026"/g' {} \;
```

### Opção 2: VSCode Find & Replace

1. Abra VSCode
2. Pressione `Ctrl+H` (Find & Replace)
3. Buscar por: `admin@aguimicell\.com`
4. Substituir por: `admin@guimicell.com`
5. Clique "Replace All"
6. Repetir para senhas se necessário

### Opção 3: Manual

Editar cada arquivo e procurar por:
- `admin@aguimicell.com` → trocar para `admin@guimicell.com`
- `aguimicell123` → trocar para `atoadm2026`

## Verificação Após Atualização

```bash
# Verificar se ainda há referências erradas
grep -r "aguimicell" tests/

# Deve retornar vazio se tudo foi corrigido
```

## Testes que Foram Atualizados Automaticamente

✅ `app/(auth)/login/page.tsx` - Contém email hardcoded comentado (removido)
✅ `app/(dashboard)/super-usuario/page.tsx` - Email check atualizado
✅ `components/layout/app-sidebar.tsx` - Email check atualizado

## Testes para Rodar Depois

```bash
# Roda um teste simples para validar credenciais
npx playwright test tests/e2e/login-test-simple.spec.ts --headed

# Roda todos os testes após atualizar credenciais
npx playwright test --headed
```

## Notas Importantes

1. **Senha pode variar** - Se uma não funcionar, tente a outra
2. **CAPTCHA é resolvido automaticamente** - Nos testes Playwright
3. **Alguns testes podem ser antigos** - Podem testar funcionalidades que mudaram

## Se Credenciais Ainda Não Funcionarem

Verificar no backend:
```sql
-- Verificar user
SELECT id, email, active FROM users WHERE email = 'admin@guimicell.com';

-- Resetar senha se necessário
UPDATE users SET password = 'seu_hash_aqui' WHERE email = 'admin@guimicell.com';
```

---

**Script para atualizar tudo de uma vez:**

```bash
#!/bin/bash
# Arquivo: update-tests.sh

echo "Atualizando credenciais em todos os testes..."
find tests -name "*.spec.ts" -type f -exec sed -i \
  's/admin@aguimicell\.com/admin@guimicell.com/g' {} \;

find tests -name "*.spec.ts" -type f -exec sed -i \
  's/"aguimicell123"/"atoadm2026"/g' {} \;

echo "✅ Credenciais atualizadas!"
echo ""
echo "Verificando se ainda há referências erradas:"
grep -r "aguimicell" tests/ || echo "Nenhuma encontrada ✅"
```

Salve como `update-tests.sh` e rode:
```bash
chmod +x update-tests.sh
./update-tests.sh
```
