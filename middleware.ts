import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const isLoggedIn = !!req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If logged in + trying to access /login → redirect to dashboard
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // If logged out + trying to access /dashboard/* → redirect to login
    if (!isLoggedIn && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For /login, allow both logged-in and logged-out users
        // (middleware above handles redirects)
        if (req.nextUrl.pathname === "/login") {
          return true
        }

        // For dashboard routes, require token
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }

        // For other routes, allow
        return true
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
    "/api/auth/:path*",
  ],
}
