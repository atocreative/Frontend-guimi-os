import type { Metadata, Viewport } from "next";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://frontend-guimi-os-production.up.railway.app";
const OG_IMAGE = `${APP_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "Guimi OS — Gestão Inteligente para Lojas",
    template: "%s | Guimi OS",
  },
  description:
    "Dashboard completo com vendas, tarefas, ranking de equipe, CRM, integrações e gestão operacional em tempo real.",
  keywords: ["gestão de lojas", "dashboard operacional", "CRM", "ranking de equipe", "GuimiCell"],
  authors: [{ name: "ATO Criative" }],
  creator: "ATO Criative",
  publisher: "GuimiCell",

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Guimi OS",
    title: "Guimi OS — Gestão Inteligente para Lojas",
    description:
      "Dashboard completo com vendas, tarefas, ranking de equipe, CRM, integrações e gestão operacional em tempo real.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Guimi OS — Gestão Inteligente para Lojas",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Guimi OS — Gestão Inteligente para Lojas",
    description:
      "Dashboard completo com vendas, tarefas, ranking de equipe, CRM, integrações e gestão operacional em tempo real.",
    images: [OG_IMAGE],
    creator: "@guimicell",
  },

  icons: {
    icon: [
      { url: "/logo.webp", type: "image/webp" },
    ],
    apple: [{ url: "/logo.webp", type: "image/webp" }],
    shortcut: "/logo.webp",
  },

  manifest: "/manifest.webmanifest",

  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f42f2" },
    { media: "(prefers-color-scheme: light)", color: "#0f42f2" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", roboto.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
