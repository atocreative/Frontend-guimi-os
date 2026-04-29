import Link from "next/link"
import { MessageCircleHeart } from "lucide-react"
import { Button } from "@/components/ui/button"

const whatsappHref = "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20GuimiCell%20OS."

export function WhatsAppButton() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-sm">
      <div className="space-y-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
          <MessageCircleHeart className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Fale com o suporte agora</h2>
          <p className="text-sm text-muted-foreground">
            Se precisar de ajuda rápida, nossa equipe também atende pelo WhatsApp.
          </p>
        </div>
        <Button asChild size="lg" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 md:w-auto">
          <Link href={whatsappHref} target="_blank" rel="noreferrer">
            Abrir WhatsApp
          </Link>
        </Button>
      </div>
    </div>
  )
}
