# PROMPT para Frontend - Corrigir Login com Captcha

## 🎯 Problema Atual

O frontend está tentando fazer login **sem o captcha obrigatório**. Por isso recebe:
- `"Credenciais inválidas"` (401)
- `"Captcha inválido"` (400)

## ✅ Solução: Implementar Fluxo de Captcha em 3 Passos

### Fluxo que o Frontend DEVE implementar:

```
┌─────────────────┐
│ Usuário clica   │
│ "Fazer Login"   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ GET /api/auth/captcha│ ◄── PASSO 1: Obter desafio
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Exibir pergunta matemática            │
│ Ex: "Quanto é 5 + 3?"                 │
│ Armazenar: token (300s timeout)       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Usuário digita resposta               │
│ Ex: "8"                               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ POST /api/auth/login                  │ ◄── PASSO 3: Fazer login
│ {                                      │
│   email: "...",                       │
│   password: "...",                    │
│   captchaAnswer: "8",        ◄── OBRIGATÓRIO
│   captchaToken: "..."        ◄── OBRIGATÓRIO
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ ✅ Login Sucesso!                     │
│ Guardar: accessToken + refreshToken   │
└──────────────────────────────────────┘
```

---

## 📝 Código Esperado (Pseudocódigo)

```javascript
// 1. Tela de Login
<form onSubmit={handleLogin}>
  <input name="email" placeholder="Email" />
  <input name="password" type="password" placeholder="Senha" />
  
  {/* NOVO: Campo de Captcha */}
  {captchaQuestion && (
    <>
      <p>{captchaQuestion}</p>
      <input 
        name="captchaAnswer" 
        placeholder="Resposta" 
        value={captchaAnswer}
      />
    </>
  )}
  
  <button type="submit">Entrar</button>
</form>

// 2. Ao renderizar a página de login
useEffect(() => {
  fetchCaptcha();
}, []);

// 3. Função para obter captcha
async function fetchCaptcha() {
  const res = await fetch('http://localhost:3001/api/auth/captcha');
  const data = await res.json();
  
  setCaptchaToken(data.data.token);
  setCaptchaQuestion(data.data.question); // Ex: "Quanto é 5 + 3?"
  setCaptchaExpiresIn(data.data.expiresIn); // 300 segundos
}

// 4. Função de login (IMPORTANTE: adicionar captchaAnswer e captchaToken)
async function handleLogin(email, password, captchaAnswer) {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      captchaAnswer,        // ◄── OBRIGATÓRIO
      captchaToken          // ◄── OBRIGATÓRIO
    })
  });
  
  if (res.ok) {
    const { data } = await res.json();
    
    // Guardar tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Redirecionar para dashboard
    navigate('/dashboard');
  } else {
    const error = await res.json();
    showError(error.message); // "Credenciais inválidas" ou "Captcha inválido"
  }
}

// 5. Em requisições autenticadas, incluir token
const fetchAPI = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}` // ◄── IMPORTANTE
    }
  });
};
```

---

## 🧪 Checklist para o Frontend

- [ ] GET `/api/auth/captcha` **ANTES** de exibir o form de login
- [ ] Armazenar `captchaToken` em estado (não localStorage)
- [ ] Exibir `captchaQuestion` para o usuário
- [ ] Campo de input para o usuário responder o captcha
- [ ] POST `/api/auth/login` com `captchaAnswer` + `captchaToken`
- [ ] Guardar `accessToken` e `refreshToken` do response
- [ ] Usar `Authorization: Bearer {accessToken}` em APIs protegidas
- [ ] Implementar refresh token quando expirar (401)

---

## 🔐 Usuários de Teste

```
admin@guimicell.com / atoadm2026 (SUPER_USER)
gui@guimicell.com.br / guiadm2026 (ADMIN)
joao@guimicell.com.br / joao12345 (COLABORADOR)
```

---

## ⚠️ Erros Comuns

| Erro | Causa | Solução |
|------|-------|--------|
| "Credenciais inválidas" | Captcha não foi enviado ou está errado | Verificar que captchaAnswer está sendo enviado |
| "Captcha inválido" | Token expirou (300s) | Refazer GET /api/auth/captcha |
| 404 `/api/auth/login` | Porta errada ou backend offline | Verificar http://localhost:3001/health |
| 401 em APIs | Token não está no header Authorization | Adicionar `Authorization: Bearer {token}` |

---

## 🎯 Resumo da Mudança Necessária

**ANTES (errado):**
```json
{
  "email": "admin@guimicell.com",
  "password": "atoadm2026"
}
```

**DEPOIS (correto):**
```json
{
  "email": "admin@guimicell.com",
  "password": "atoadm2026",
  "captchaAnswer": "8",
  "captchaToken": "eyJhbGciOiJIUzI1NiI..."
}
```

---

**Implemente isso e o login vai funcionar! 🚀**
