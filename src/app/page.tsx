"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function NexusLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 rotate-45 items-center justify-center rounded-sm border-2 border-cyan-brand">
        <div className="h-3 w-3 -rotate-45 bg-gold-brand" />
      </div>
      <span className="font-heading text-xl font-bold tracking-[0.2em] text-ink">
        NEXUS NODE
      </span>
    </div>
  );
}

const TICKER_ITEMS = [
  { label: "LME COBRE 3M", value: "$9,847.50/MT", dir: "up", delta: "+0.32%" },
  { label: "LOTES EN VALIDACIÓN", value: "7" },
  { label: "TONELADAS PUBLICADAS HOY", value: "1,240 MT" },
  { label: "LME COBRE SPOT", value: "$9,901.20/MT", dir: "down", delta: "-0.12%" },
  { label: "LOTES EN ESCROW", value: "19" },
];

function Ticker() {
  return (
    <div className="overflow-hidden whitespace-nowrap border-b border-line bg-slate-panel py-2">
      <div className="ticker-track inline-flex">
        {[0, 1].map((rep) => (
          <div key={rep} className="inline-flex">
            {TICKER_ITEMS.map((item, i) => (
              <span
                key={`${rep}-${i}`}
                className="inline-flex items-center gap-1.5 border-r border-line px-6 font-mono text-xs text-ink-soft"
              >
                {item.label} <b className="font-medium text-ink">{item.value}</b>
                {item.dir && (
                  <span className={item.dir === "up" ? "text-emerald-600" : "text-rose-600"}>
                    {item.delta}
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <style jsx>{`
        .ticker-track {
          animation: ticker-scroll 28s linear infinite;
        }
        @keyframes ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function LotCertificate() {
  const [price, setPrice] = useState(9847.5);

  useEffect(() => {
    const id = setInterval(() => {
      setPrice((p) => p + (Math.random() - 0.5) * 7);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            Certificado de Lote · Nexus Node
          </p>
          <p className="mt-1 font-mono text-xs text-ink">NN-2291 / SGS-MX-08841</p>
        </div>
        <span className="rounded-full border border-cyan-brand/30 bg-cyan-brand/5 px-2.5 py-1 font-mono text-[10px] text-cyan-brand">
          ✓ SGS Verificado
        </span>
      </div>
      <div className="space-y-2 border-t border-line pt-3 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-ink-soft">Cátodo</span>
          <span className="text-ink">Grado A · 99.95%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-soft">Peso neto</span>
          <span className="text-ink">480.00 MT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-soft">Puerto</span>
          <span className="text-ink">Manzanillo, MX</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-mono text-[11px] text-ink-soft">LME 3M en vivo</span>
        <span className="font-mono text-xl text-cyan-brand">${price.toFixed(2)}</span>
      </div>
      <Link href="/comprador/catalogo" className="btn-primary mt-4 w-full text-sm">
        Reservar vía Escrow
      </Link>
    </div>
  );
}

const PASOS = [
  { estatus: "borrador", title: "Registro", desc: "El minero sube el lote y sus documentos." },
  { estatus: "validando", title: "Validación IA", desc: "Se cruzan certificados, pureza y pedimento." },
  { estatus: "publicado", title: "Marketplace", desc: "El lote queda visible a compradores verificados." },
  { estatus: "en_escrow", title: "Escrow", desc: "El comprador deposita en Fideicomiso/STP." },
  { estatus: "completado", title: "Liberación", desc: "BL a bordo confirmado, pago liberado al minero." },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

function RevealItem({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Ticker />

      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <NexusLogo />
        <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          Protocolo Zero-Trust v1.0
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 md:px-10">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 text-center lg:text-left">
            <div
              className="fade-up inline-flex items-center gap-2 rounded-full border border-cyan-brand/30 bg-cyan-brand/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan-brand"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-brand" />
              Infraestructura Institucional
            </div>

            <h1
              className="fade-up font-heading text-4xl font-bold leading-tight text-ink md:text-6xl"
              style={{ animationDelay: "0.15s" }}
            >
              Nexus Node
              <span className="mt-2 block text-2xl font-semibold text-gold-brand md:text-3xl">
                Protocolo Zero-Trust
              </span>
            </h1>

            <p
              className="fade-up mx-auto max-w-2xl text-lg leading-relaxed text-ink-soft lg:mx-0"
              style={{ animationDelay: "0.25s" }}
            >
              Plataforma de gobernanza para validación criptográfica de lotes de
              cobre en puertos LATAM. Eliminamos intermediación opaca mediante
              fideicomisos, trazabilidad aduanal y liquidación en 72 horas.
            </p>

            <div
              className="fade-up flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
              style={{ animationDelay: "0.35s" }}
            >
              <Link href="/minero" className="btn-primary text-base">
                Entrar al Protocolo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <span className="font-mono text-xs text-ink-soft">
                Manzanillo · Veracruz · Escrow Criptográfico
              </span>
            </div>
          </div>

          <div className="fade-up" style={{ animationDelay: "0.3s" }}>
            <LotCertificate />
          </div>
        </div>

        <div className="mt-16 flex w-full max-w-6xl flex-wrap justify-center gap-x-10 gap-y-3 border-y border-line py-6 font-mono text-xs text-ink-soft">
          <span>✓ Certificación SGS</span>
          <span>✓ Alex Stewart</span>
          <span>✓ Precio LME en vivo</span>
          <span>✓ Fideicomiso / STP</span>
          <span>✓ Contrato NOM-151</span>
        </div>

        <section className="mt-20 w-full max-w-6xl">
          <h2 className="mb-8 text-center font-heading text-2xl font-semibold text-ink">
            De la mina al pago, en cinco pasos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PASOS.map((paso, i) => (
              <RevealItem key={paso.estatus} delay={i * 80}>
                <div className="glass-panel h-full rounded-xl p-5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-brand">
                    {paso.estatus}
                  </span>
                  <h3 className="mt-2 font-heading text-sm font-semibold text-ink">
                    {paso.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                    {paso.desc}
                  </p>
                </div>
              </RevealItem>
            ))}
          </div>
        </section>

        <section className="mt-20 grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              label: "Validación",
              title: "Trazabilidad Aduanal",
              desc: "Certificación criptográfica de origen y pureza en tiempo real.",
            },
            {
              label: "Liquidación",
              title: "Escrow 72h",
              desc: "Fideicomisos institucionales con liberación automática post-validación.",
            },
            {
              label: "Gobernanza",
              title: "Zero-Trust",
              desc: "Sin intermediarios opacos. Cada actor verificado en la red Nexus.",
            },
          ].map((item, i) => (
            <RevealItem key={item.title} delay={i * 100}>
              <article className="glass-panel h-full rounded-xl p-6 text-left transition-all hover:-translate-y-1 hover:border-gold-brand/40 hover:shadow-[0_16px_30px_-18px_rgba(36,26,20,0.25)]">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-brand">
                  {item.label}
                </span>
                <h2 className="mt-3 font-heading text-lg font-semibold text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.desc}
                </p>
              </article>
            </RevealItem>
          ))}
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center font-mono text-xs text-ink-soft md:px-10">
        NEXUS NODE OS · Infraestructura Financiera para Commodities
      </footer>
    </div>
  );
}
