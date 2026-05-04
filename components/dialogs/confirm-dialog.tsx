"use client"

import { useState, useCallback, ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmDialogRef {
  open: (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
  }) => Promise<boolean>
}

interface ConfirmDialogProps {
  ref?: React.Ref<ConfirmDialogRef>
}

export const ConfirmDialog = ({ ref }: ConfirmDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [confirmText, setConfirmText] = useState("Confirmar")
  const [cancelText, setCancelText] = useState("Cancelar")
  const [isDangerous, setIsDangerous] = useState(false)
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null)

  const handleOpen = useCallback(
    (options: {
      title: string
      description: string
      confirmText?: string
      cancelText?: string
      isDangerous?: boolean
    }) => {
      return new Promise<boolean>((resolver) => {
        setTitle(options.title)
        setDescription(options.description)
        setConfirmText(options.confirmText || "Confirmar")
        setCancelText(options.cancelText || "Cancelar")
        setIsDangerous(options.isDangerous ?? false)
        setResolve(() => resolver)
        setIsOpen(true)
      })
    },
    []
  )

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    resolve?.(true)
  }, [resolve])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolve?.(false)
  }, [resolve])

  if (ref) {
    ;(ref as any).current = { open: handleOpen }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <AlertDialogAction
            onClick={handleConfirm}
            className={isDangerous ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
