import { EmailForm } from "@/components/support/email-form"
import { FaqSection } from "@/components/support/faq-section"
import { WhatsAppButton } from "@/components/support/whatsapp-button"

export default function SuportePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Área de Suporte</h2>
        <p className="text-sm text-muted-foreground">
          Fale com o suporte, envie dúvidas por e-mail e consulte as perguntas mais frequentes.
        </p>
      </div>

      <WhatsAppButton />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <EmailForm />
        <FaqSection />
      </div>
    </div>
  )
}
