"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { TokenExpirationModal } from "@/components/auth/token-expiration-modal"
import { setTokenExpirationHandler } from "@/lib/api-client"

interface AuthContextType {
  showTokenExpiredModal: () => void
  hideTokenExpiredModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false)

  const showTokenExpiredModal = useCallback(() => {
    setShowModal(true)
  }, [])

  const hideTokenExpiredModal = useCallback(() => {
    setShowModal(false)
  }, [])

  // Register token expiration handler on mount
  useEffect(() => {
    setTokenExpirationHandler(() => showTokenExpiredModal())
  }, [showTokenExpiredModal])

  return (
    <AuthContext.Provider value={{ showTokenExpiredModal, hideTokenExpiredModal }}>
      {children}
      <TokenExpirationModal isOpen={showModal} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider")
  }
  return context
}
