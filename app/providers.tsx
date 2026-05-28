"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { AuthContextProvider } from "@/context/auth-context"
import { ConfirmDialogProvider } from "@/context/confirm-dialog-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthContextProvider>
          <ConfirmDialogProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              {children}
              <Toaster richColors />
            </ThemeProvider>
          </ConfirmDialogProvider>
        </AuthContextProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
