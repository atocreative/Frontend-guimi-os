import { FaqSection } from "@/components/support/faq-section"
import { WhatsAppButton } from "@/components/support/whatsapp-button"

export default function SuportePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Suporte</h2>
        <p className="text-sm text-muted-foreground">
          Entre em contato ou consulte as perguntas mais frequentes abaixo.
        </p>
      </div>

      <WhatsAppButton />

      <FaqSection />
    </div>
  )
}
