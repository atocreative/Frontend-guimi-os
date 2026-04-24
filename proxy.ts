import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

export const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role
  const isLoggedIn = !!req.auth

  // Se não está logado, redireciona para login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Rotas exclusivas do Admin
  if (pathname.startsWith("/configuracoes") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Financeiro bloqueado para Colaborador
  if (pathname.startsWith("/financeiro") && role === "COLABORADOR") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|login).*)",
  ],
}
