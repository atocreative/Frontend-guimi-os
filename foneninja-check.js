const fs = require('fs');
const path = require('path');

loadDotEnv();

const EMAIL = process.env.FONENINJA_EMAIL;
const PASSWORD = process.env.FONENINJA_PASSWORD;
const BASE_URL = 'https://api.fone.ninja';
const ERP_LOJAS = `${BASE_URL}/erp/api/lojas`;

const COMMON_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
  Origin: 'https://app.fone.ninja',
  Referer: 'https://app.fone.ninja/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
};

const ENDPOINTS = [
  { name: 'Produtos',          path: '/produtos',                       query: '?rows=1&page=1&perPage=1' },
  { name: 'Apples',            path: '/apples',                         query: '?rows=1&page=1&perPage=1' },
  { name: 'Vendas',            path: '/vendas',                         query: '?rows=1&sortField=data_saida&sortOrder=-1&first=0&sort=data_saida:desc&page=1&perPage=1' },
  { name: 'Estoque',           path: '/refactored-estoque',             query: '?first=0&last=1' },
  { name: 'Compras',           path: '/compras',                        query: '?rows=1&sortField=data_entrada&sortOrder=-1&first=0&page=1&perPage=1' },
  { name: 'Contas a pagar',    path: '/financeiro/refactored-contas',   query: '?rows=1&filters%5Btipo%5D%5B$eq%5D=pagar&page=1&perPage=1' },
  { name: 'Contas a receber',  path: '/financeiro/refactored-contas',   query: '?rows=1&filters%5Btipo%5D%5B$eq%5D=receber&page=1&perPage=1' },
  { name: 'Movimentações',     path: '/movimentacoes',                  query: '?rows=1&sortField=created_at&sortOrder=-1&first=0&page=1&perPage=1' },
  { name: 'Produtos refactor', path: '/refactored-produtos',            query: '?rows=1&page=1&perPage=1' },
];

async function main() {
  console.log('=== FoneNinja API check ===\n');

  // 1. Obter token válido
  const token = await resolveToken();
  if (!token) {
    console.error('Não foi possível obter um token válido. Verifique suas credenciais.');
    process.exitCode = 1;
    return;
  }

  // 2. Descobrir LOJA_ID
  const lojaId = await resolveLojaId(token);
  if (!lojaId) {
    console.error('\nNão foi possível descobrir o LOJA_ID.');
    console.error('Verifique se a conta tem lojas associadas ou defina FONENINJA_LOJA_ID manualmente no .env');
    process.exitCode = 1;
    return;
  }

  // 3. Atualizar .env com novos valores
  updateEnv(token, String(lojaId));

  // 4. Testar todos os endpoints
  console.log(`\n=== Testando endpoints para loja ${lojaId} ===`);
  for (const ep of ENDPOINTS) {
    const url = `${ERP_LOJAS}/${lojaId}${ep.path}${ep.query}`;
    try {
      const res = await fetch(url, { headers: { ...COMMON_HEADERS, Authorization: `Bearer ${token}` } });
      const text = await res.text();
      const preview = summarize(text);
      console.log(`\n[${ep.name}] ${res.status} ${res.statusText}`);
      console.log(`  ${preview}`);
    } catch (err) {
      console.log(`\n[${ep.name}] ERRO: ${err.message}`);
    }
  }
}

// ── Token ────────────────────────────────────────────────────────────────────

async function resolveToken() {
  const stored = process.env.FONENINJA_TOKEN;

  if (stored && !isExpired(stored)) {
    console.log(`Token do .env ainda válido: ${mask(stored)}`);
    return stored;
  }

  if (stored) {
    console.log('Token do .env expirado. Fazendo login automaticamente...');
  } else {
    console.log('Nenhum token encontrado. Fazendo login...');
  }

  return await login();
}

function isExpired(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return true;
  }
}

async function login() {
  if (!EMAIL || !PASSWORD) {
    console.error('FONENINJA_EMAIL e FONENINJA_PASSWORD não definidos no .env');
    return null;
  }

  const candidates = [
    { url: `${BASE_URL}/auth/api/suporte/login`,  body: { email: EMAIL, password: PASSWORD } },
    { url: `${BASE_URL}/auth/api/login`,           body: { email: EMAIL, password: PASSWORD } },
    { url: `${BASE_URL}/auth/api/auth/login`,      body: { email: EMAIL, password: PASSWORD } },
    { url: `${BASE_URL}/auth/api/suporte/login`,   body: { login: EMAIL, password: PASSWORD } },
    { url: `${BASE_URL}/auth/api/login`,           body: { login: EMAIL, password: PASSWORD } },
  ];

  for (const { url, body } of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }

      const token =
        data?.token ||
        data?.access_token ||
        data?.payload?.token ||
        data?.payload?.access_token ||
        data?.data?.token ||
        data?.data?.access_token;

      if (res.ok && token) {
        console.log(`Login OK via ${url}`);
        console.log(`Novo token: ${mask(token)}`);
        return token;
      }

      console.log(`  ${url} → ${res.status} (sem token na resposta)`);
      if (text) console.log(`  Body: ${truncate(text, 200)}`);
    } catch (err) {
      console.log(`  ${url} → ERRO: ${err.message}`);
    }
  }

  return null;
}

// ── LOJA_ID ──────────────────────────────────────────────────────────────────

async function resolveLojaId(token) {
  console.log('\n=== Descobrindo LOJA_ID ===');

  // 1. Tentar listar lojas diretamente
  const id = await tryListLojas(token);
  if (id) return id;

  // 2. Tentar endpoints de perfil do usuário
  const profileId = await tryUserProfile(token);
  if (profileId) return profileId;

  // 3. Tentar candidatos estáticos
  const staticCandidates = ['1', '2', '42', '100'];
  for (const id of staticCandidates) {
    console.log(`  Tentando loja ID = ${id}...`);
    if (await probeLojaId(token, id)) return id;
  }

  return null;
}

async function tryListLojas(token) {
  const urls = [
    `${BASE_URL}/erp/api/lojas`,
    `${BASE_URL}/erp/api/lojas?page=1&perPage=10`,
    `${BASE_URL}/erp/api/user/lojas`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { ...COMMON_HEADERS, Authorization: `Bearer ${token}` } });
      if (!res.ok) continue;

      const data = await res.json().catch(() => null);
      if (!data) continue;

      // Normalizar: pode vir como array, { data: [...] }, { lojas: [...] }
      const list = Array.isArray(data) ? data : (data.data ?? data.lojas ?? null);
      if (Array.isArray(list) && list.length > 0) {
        // API usa identificador (slug) como chave nas rotas, não o id numérico
        const lojaId = list[0].identificador ?? list[0].id ?? list[0].loja_id;
        if (lojaId) {
          console.log(`  Lojas encontradas via ${url}:`);
          list.slice(0, 5).forEach(l =>
            console.log(`    - identificador="${l.identificador ?? '?'}" id=${l.id} nome="${l.nome_fantasia ?? l.nome ?? l.name ?? '?'}"`),
          );
          return String(lojaId);
        }
      }
    } catch { /* continuar */ }
  }
  return null;
}

async function tryUserProfile(token) {
  const urls = [
    `${BASE_URL}/erp/api/me`,
    `${BASE_URL}/erp/api/user/me`,
    `${BASE_URL}/erp/api/users/me`,
    `${BASE_URL}/auth/api/me`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { ...COMMON_HEADERS, Authorization: `Bearer ${token}` } });
      if (!res.ok) continue;

      const data = await res.json().catch(() => null);
      if (!data) continue;

      const lojaId =
        data.loja_id ??
        data.loja?.id ??
        data.data?.loja_id ??
        data.data?.loja?.id;

      if (lojaId) {
        console.log(`  LOJA_ID descoberto via perfil (${url}): ${lojaId}`);
        return String(lojaId);
      }
    } catch { /* continuar */ }
  }
  return null;
}

async function probeLojaId(token, id) {
  const url = `${ERP_LOJAS}/${id}/vendas?perPage=1&page=1`;
  try {
    const res = await fetch(url, { headers: { ...COMMON_HEADERS, Authorization: `Bearer ${token}` } });
    if (res.ok) {
      console.log(`  LOJA_ID ${id} → ${res.status} ✓`);
      return true;
    }
    console.log(`  LOJA_ID ${id} → ${res.status}`);
    return false;
  } catch {
    return false;
  }
}

function extractSubFromJwt(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

// ── .env update ───────────────────────────────────────────────────────────────

function updateEnv(token, lojaId) {
  const envPath = path.join(process.cwd(), '.env');
  try {
    let content = fs.readFileSync(envPath, 'utf8');

    if (/^FONENINJA_TOKEN=/m.test(content)) {
      content = content.replace(/^FONENINJA_TOKEN=.*/m, `FONENINJA_TOKEN=${token}`);
    } else {
      content += `\nFONENINJA_TOKEN=${token}`;
    }

    if (/^FONENINJA_LOJA_ID=/m.test(content)) {
      content = content.replace(/^FONENINJA_LOJA_ID=.*/m, `FONENINJA_LOJA_ID=${lojaId}`);
    } else {
      content += `\nFONENINJA_LOJA_ID=${lojaId}`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`\n.env atualizado → TOKEN=${mask(token)}  LOJA_ID=${lojaId}`);
  } catch (err) {
    console.warn(`Aviso: não foi possível atualizar .env: ${err.message}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!key || process.env[key] !== undefined) continue;
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  }
}

function mask(token) {
  if (!token) return '(ausente)';
  return token.length <= 12 ? `${token.slice(0, 3)}***` : `${token.slice(0, 8)}...${token.slice(-4)}`;
}

function truncate(str, max) {
  const s = String(str).replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max)}...`;
}

function summarize(text) {
  try {
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : (data.data ?? data.items ?? data.results ?? null);
    if (Array.isArray(list)) return `${list.length} itens. Primeiro: ${JSON.stringify(list[0]).slice(0, 120)}`;
    if (data && typeof data === 'object') return JSON.stringify(data).slice(0, 200);
  } catch { /* não é JSON */ }
  return truncate(text, 200);
}

main().catch((err) => {
  console.error('\nFalha inesperada:', err);
  process.exitCode = 1;
});
