import Link from "next/link"

// Links focados em ajuda e institucional, não em navegação de páginas que já estão no menu
const footerLinks = [
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/suporte", label: "Ajuda & Suporte" },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-muted-foreground">
      <div className="flex flex-col gap-4 px-4 py-3 text-[11px] font-medium md:flex-row md:items-center md:justify-between md:px-6">
        
        {/* Esquerda: Info da Empresa e Software */}
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-foreground">GuimiCell OS</span>
            <span className="hidden md:inline text-border">|</span>
            <span>© {currentYear} · Todos os direitos reservados</span>
          </p>
          <p className="text-muted-foreground/60 italic">
            Desenvolvido por <span className="font-bold text-foreground/80 hover:text-primary transition-colors cursor-default">ATO.</span>
          </p>
        </div>

        {/* Direita: Links Úteis */}
        <nav className="flex items-center gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
