import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isSuperUser = Boolean(req.auth?.user?.isSuperUser);
  const isLoggedIn = !!req.auth;
  const isAdmin = role === "ADMIN" || isSuperUser;

  // If logged in and trying to access login page, redirect to dashboard/home
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If not logged in and trying to access protected dashboard routes, redirect to login
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role based restrictions
  if (pathname.startsWith("/configuracoes") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/financeiro") && role === "COLABORADOR" && !isSuperUser) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|api/auth|_next/static|_next/image|_next/data|favicon.ico|login).*)",
    "/api/auth/:path*",
  ],
};
