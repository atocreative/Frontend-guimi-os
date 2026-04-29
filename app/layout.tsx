import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
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
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          <TooltipProvider>
            <div className="flex min-h-screen flex-1 flex-col">
              <div className="flex-1 min-h-0">{children}</div>
              <Footer />
            </div>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
