import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Guimicell OS",
  description: "Painel operacional interno",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${roboto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <TooltipProvider>
            <div className="flex flex-1 flex-col">{children}</div>
          </TooltipProvider>
          <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 py-3 text-center text-xs text-zinc-500">
            Todos os direitos reservados à ATO.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
