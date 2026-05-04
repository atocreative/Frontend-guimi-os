import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const { auth } = NextAuth(authConfig);

// Rotas públicas — acessíveis sem autenticação
const PUBLIC_PATHS = ["/login", "/termos", "/privacidade"];

// Rotas internas — NUNCA interceptar (causam loop se interceptadas)
const INTERNAL_PREFIXES = [
  "/api/auth",   // NextAuth internals — loop se interceptado
  "/api/",       // Todas as API routes Next.js — auth feita dentro de cada handler
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isInternal(pathname: string) {
  return INTERNAL_PREFIXES.some((p) => pathname.startsWith(p));
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // 1. Rotas internas e APIs — jamais redirecionar
  if (isInternal(pathname)) {
    return NextResponse.next();
  }

  // 2. Rotas públicas — qualquer um pode acessar
  if (isPublic(pathname)) {
    // Se já logado, sai do login
    if (req.auth && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 3. Não logado em rota protegida → login (nunca redireciona se já está em /login)
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth?.user?.role as string | undefined;
  const isSuperUser = Boolean((req.auth?.user as any)?.isSuperUser);

  // 4. SUPER_USER bypassa todas as restrições de role
  if (isSuperUser || role === "SUPER_USER") {
    return NextResponse.next();
  }

  // 5. Legacy redirect
  if (pathname.startsWith("/super-usuario")) {
    return NextResponse.redirect(new URL("/dashboard-development", req.url));
  }

  // 6. dashboard-development é exclusivo do SUPER_USER
  if (pathname.startsWith("/dashboard-development")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 7. Restrições por role
  if (pathname.startsWith("/configuracoes") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/financeiro") && role === "COLABORADOR") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 8. Feature flags dinâmicas — só para rotas de páginas, não APIs
  //    Feito de forma não-bloqueante: falha silenciosa permite acesso (fail-open)
  const ROUTE_FEATURE_MAP: Record<string, string> = {
    "/comercial": "COMERCIAL",
    "/financeiro": "FINANCEIRO",
    "/agenda": "AGENDA",
    "/operacao": "OPERACAO",
    "/processos": "PROCESSOS",
    "/colaboradores": "COLABORADORES",
    "/indicadores": "INDICADORES",
    "/configuracoes": "CONFIGURACOES",
    "/suporte": "SUPORTE",
  };

  const featureId = Object.entries(ROUTE_FEATURE_MAP).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (featureId) {
    const accessToken = (req.auth as any)?.accessToken as string | undefined;
    if (accessToken) {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiBase}/api/dev-menu`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: AbortSignal.timeout(2000), // não bloquear por mais de 2s
        });

        if (res.ok) {
          const data = await res.json();
          const items: any[] = Array.isArray(data) ? data : (data.data || data.menu || []);
          const item = items.find(
            (i: any) => i.featureId === featureId || i.id === featureId.toLowerCase()
          );

          if (item) {
            if (!item.enabled) {
              return NextResponse.redirect(new URL("/", req.url));
            }
            if (
              item.allowedRoles?.length > 0 &&
              role &&
              !item.allowedRoles.includes(role)
            ) {
              return NextResponse.redirect(new URL("/", req.url));
            }
          }
        }
      } catch {
        // Fail-open: se backend inatingível, permite acesso
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - api/auth (NextAuth internals — NUNCA interceptar, causa loop)
     * - api/ (API routes — auth feita dentro de cada handler)
     * - Arquivos de imagem/fonte estáticos
     */
    "/((?!_next/static|_next/image|_next/data|api/auth|api/|favicon\\.ico|.*\\.webp|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};
