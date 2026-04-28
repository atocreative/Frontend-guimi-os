"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api, ApiError } from "@/lib/api-client"
import { mfaVerifySchema } from "@/lib/schemas"

interface MfaModalUser {
  id: string
  name: string
  email: string
  role: string
  jobTitle?: string | null
}

interface MfaModalProps {
  challengeToken: string
  onSuccess: (payload: { token: string; user: MfaModalUser }) => Promise<void> | void
}

export function MfaModal({ challengeToken, onSuccess }: MfaModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const isComplete = useMemo(() => /^\d{6}$/.test(code), [code])

  async function handleSubmit() {
    const parsed = mfaVerifySchema.safeParse({ challengeToken, code })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Código inválido ou expirado."
      setError(message)
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await api.verifyMfa(parsed.data)
      await onSuccess({ token: result.token, user: result.user })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Código inválido ou expirado.")
      } else {
        setError("Não foi possível verificar o código agora.")
      }
      setCode("")
      requestAnimationFrame(() => inputRef.current?.focus())
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open onOpenChange={() => {}}>
      <SheetContent side="right" className="w-full sm:max-w-md" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Verificação em duas etapas</SheetTitle>
          <SheetDescription>
            Insira seu código de 6 dígitos para concluir o login.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          className="flex flex-1 flex-col gap-4 px-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="mfa-code">Código</Label>
            <Input
              ref={inputRef}
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              disabled={loading}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6)
                setCode(next)
                if (error) {
                  setError("")
                }
              }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </form>

        <SheetFooter className="px-4">
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading || !isComplete}>
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
