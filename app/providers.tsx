"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { AuthContextProvider } from "@/context/auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </AuthContextProvider>
    </SessionProvider>
  )
}
