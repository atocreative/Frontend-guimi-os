import Link from "next/link"

const footerLinks = [
  { href: "/suporte", label: "Suporte" },
  { href: "/agenda", label: "Agenda" },
  { href: "/indicadores", label: "Indicadores" },
] as const

export function Footer() {
  return (
    <footer className="border-t border-secondary/20 bg-card text-foreground/70 dark:bg-slate-950 dark:border-secondary/30">
      <div className="flex flex-col gap-3 px-4 py-3 text-xs md:flex-row md:items-center md:justify-between md:px-6">
        <p className="flex items-center gap-2">
          <span className="text-secondary">●</span>
          GuimiCell OS © 2026 · Suporte operacional interno
        </p>
        <nav className="flex flex-wrap items-center gap-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-secondary hover:font-semibold"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-foreground/50">v0.1.0</span>
        </nav>
      </div>
    </footer>
  )
}
