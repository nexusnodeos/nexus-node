import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const heading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Nexus Node — Protocolo Zero-Trust",
  description:
    "Plataforma institucional de infraestructura financiera y validación criptográfica para commodities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${heading.variable} ${body.variable} ${mono.variable} min-h-full font-body`}
      >
        <div className="relative min-h-screen overflow-x-hidden bg-slate-deep">
          <div
            className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-cyan-brand/5 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-gold-brand/5 blur-3xl"
            aria-hidden
          />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
