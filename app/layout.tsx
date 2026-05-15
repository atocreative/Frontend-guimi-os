import type { Metadata } from "next";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
      className={cn("h-full", "antialiased", roboto.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
