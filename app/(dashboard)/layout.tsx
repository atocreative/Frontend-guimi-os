import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const { name, email, role } = session.user as {
    name: string
    email: string
    role: string
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={role} />
      <SidebarInset className="min-h-svh overflow-hidden">
        <Header
          userName={name}
          userEmail={email}
          userRole={role}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-4">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
