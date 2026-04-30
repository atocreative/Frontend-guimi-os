import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
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
      <AppSidebar userRole={role} userEmail={email} />
      <SidebarInset className="flex flex-col min-h-svh">
        <Header
          userName={name}
          userEmail={email}
          userRole={role}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {children}
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
