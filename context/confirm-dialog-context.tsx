"use client"

import { createContext, useContext, useRef, ReactNode } from "react"
import { ConfirmDialog, ConfirmDialogRef } from "@/components/dialogs/confirm-dialog"

interface ConfirmDialogContextType {
  confirm: (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
  }) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<ConfirmDialogRef>(null)

  const confirm = async (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
  }) => {
    return dialogRef.current?.open(options) ?? false
  }

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog ref={dialogRef} />
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider")
  }
  return context
}
