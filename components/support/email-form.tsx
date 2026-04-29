"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supportEmailSchema } from "@/lib/schemas"

type SupportEmailForm = {
  name: string
  email: string
  subject: string
  message: string
}

const supportEmail = "suporte@guimicell.com.br"

export function EmailForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportEmailForm>({
    resolver: zodResolver(supportEmailSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  async function onSubmit(data: SupportEmailForm) {
    const params = new URLSearchParams({
      subject: `[Suporte GuimiCell OS] ${data.subject}`,
      body: `Nome: ${data.name}\nEmail: ${data.email}\n\nMensagem:\n${data.message}`,
    })

    if (typeof window !== "undefined") {
      window.open(`mailto:${supportEmail}?${params.toString()}`, "_self")
    }

    setSubmitted(true)
    reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar e-mail para o suporte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          As mensagens serão direcionadas para <span className="font-medium text-foreground">{supportEmail}</span>.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>
                <Label htmlFor="support-name">Nome</Label>
              </FieldLabel>
              <FieldContent>
                <Input id="support-name" {...register("name")} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <Label htmlFor="support-email">Email</Label>
              </FieldLabel>
              <FieldContent>
                <Input id="support-email" type="email" {...register("email")} />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <Label htmlFor="support-subject">Assunto</Label>
              </FieldLabel>
              <FieldContent>
                <Input id="support-subject" {...register("subject")} />
                <FieldError errors={errors.subject ? [errors.subject] : undefined} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <Label htmlFor="support-message">Mensagem</Label>
              </FieldLabel>
              <FieldContent>
                <textarea
                  id="support-message"
                  className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("message")}
                />
                <FieldError errors={errors.message ? [errors.message] : undefined} />
              </FieldContent>
            </Field>
          </FieldGroup>

          {submitted ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              Seu cliente de e-mail foi acionado com os dados preenchidos.
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
            {isSubmitting ? "Preparando..." : "Enviar para o suporte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
