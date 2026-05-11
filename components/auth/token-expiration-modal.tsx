"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TokenExpirationModalProps {
  isOpen: boolean
}

export function TokenExpirationModal({ isOpen }: TokenExpirationModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) return

    // Auto-redirect after 2.5 seconds
    const timer = setTimeout(() => {
      handleLogout()
    }, 2500)

    return () => clearTimeout(timer)
  }, [isOpen])

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="p-6"> {/* p-6 aumenta o respiro interno do modal */}
        <AlertDialogTitle>Sessão Expirada</AlertDialogTitle>
        <AlertDialogDescription>
          Sua sessão expirou. Por favor, faça login novamente.
        </AlertDialogDescription>
        
        {/* Adicionei mt-6 para empurrar o botão para baixo */}
        <AlertDialogAction 
          onClick={handleLogout}
          className="mt-6 cursor-pointer hover:bg-primary/90 transition-colors"
        >
          Voltar ao Login
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}
