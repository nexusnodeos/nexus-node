"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* ---------- scroll reveal (reused across sections) ---------- */

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

function Reveal({
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
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- placeholder photography block ---------- */

function PlaceholderPhoto({
  label,
  deep = false,
  className = "",
  style,
}: {
  label: string;
  deep?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden rounded-2xl border border-line p-4 ${
        deep
          ? "bg-gradient-to-br from-[#E7CBAE] via-[#B97D46] to-[#8C4620]"
          : "bg-gradient-to-br from-[#F3D9BC] via-[#D99B5E] to-[#B5602E]"
      } ${className}`}
      style={style}
    >
      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-semibold text-ink">
        {label}
      </span>
    </div>
  );
}

/* ---------- nav ---------- */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-white/90 px-[6%] py-5 backdrop-blur-md">
      <div className="font-heading text-lg font-extrabold tracking-tight text-ink">
        NEXUS<span className="text-cyan-brand">NODE</span>
      </div>
      <div className="hidden gap-8 text-sm font-medium text-ink-soft md:flex">
        <a href="#como-funciona" className="nav-link">Cómo funciona</a>
        <a href="#plataforma" className="nav-link">Plataforma</a>
        <Link href="/minero" className="nav-link">Para mineros</Link>
      </div>
      <div className="flex gap-2.5">
        <Link href="/minero" className="btn-secondary text-sm">
          Iniciar sesión
        </Link>
        <Link href="/comprador/catalogo" className="btn-primary text-sm">
          Ver Marketplace
        </Link>
      </div>
    </nav>
  );
}

/* ---------- hero ---------- */

const CHECKLIST = [
  "Precio indexado a LME",
  "Certificación SGS / Alex Stewart",
  "Pago vía Fideicomiso (STP)",
  "Validación de IA por lote",
];

function Hero() {
  return (
    <div className="grid gap-14 px-[6%] pb-10 pt-16 md:grid-cols-2 md:items-center md:gap-16">
      <div>
        <p className="fade-up mb-4 font-mono text-[13.5px] font-semibold text-cyan-brand">
          MARKETPLACE DE COBRE CERTIFICADO
        </p>
        <h1
          className="fade-up font-heading text-4xl font-extrabold leading-[1.12] tracking-tight text-ink md:text-5xl"
          style={{ animationDelay: "0.15s" }}
        >
          Vende y compra cobre{" "}
          <span className="text-cyan-brand">con papeles que sí cierran</span>{" "}
          en aduana
        </h1>
        <p
          className="fade-up mb-7 mt-4 max-w-md text-base leading-relaxed text-ink-soft"
          style={{ animationDelay: "0.25s" }}
        >
          Conectamos mineros y compradores internacionales con precios
          indexados a LME, validación de documentos por IA y pago protegido
          en Fideicomiso.
        </p>
        <div
          className="fade-up mb-7 flex flex-wrap gap-3"
          style={{ animationDelay: "0.35s" }}
        >
          <Link href="/minero" className="btn-primary text-sm">
            Publicar un Lote
          </Link>
          <Link href="/comprador/catalogo" className="btn-secondary text-sm">
            Ver Lotes Disponibles
          </Link>
        </div>
        <div
          className="fade-up grid max-w-md grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2"
          style={{ animationDelay: "0.45s" }}
        >
          {CHECKLIST.map((item) => (
            <div key={item} className="group flex items-center gap-2.5 text-sm text-ink-soft">
              <span className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-full bg-cyan-brand/10 text-[11px] text-gold-brand transition-transform group-hover:scale-110">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <PlaceholderPhoto
          label="Cátodo de cobre grado A — 99.95%"
          className="fade-up col-span-2 h-[190px]"
          style={{ animationDelay: "0.3s" }}
        />
        <PlaceholderPhoto
          label="Puerto de Manzanillo"
          deep
          className="fade-up h-[150px]"
          style={{ animationDelay: "0.42s" }}
        />
        <PlaceholderPhoto
          label="Certificado SGS"
          className="fade-up h-[150px]"
          style={{ animationDelay: "0.54s" }}
        />
      </div>
    </div>
  );
}

/* ---------- trust bar ---------- */

const TRUST_ITEMS = [
  "Certificación SGS",
  "Alex Stewart",
  "Precio LME en vivo",
  "Fideicomiso / STP",
  "Contrato NOM-151",
];

function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-11 gap-y-3 border-y border-line bg-slate-panel px-[6%] py-6">
      {TRUST_ITEMS.map((item) => (
        <div key={item} className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          ✓ {item}
        </div>
      ))}
    </div>
  );
}

/* ---------- cómo funciona ---------- */

const PASOS = [
  { n: "01", title: "Registro", desc: "El minero sube el lote y sus documentos." },
  { n: "02", title: "Validación IA", desc: "Se cruzan certificados, pureza y pedimento." },
  { n: "03", title: "Publicación", desc: "El lote aparece en el Marketplace." },
  { n: "04", title: "Escrow", desc: "El comprador deposita en Fideicomiso." },
  { n: "05", title: "Liberación", desc: "BL confirmado, pago liberado al minero." },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="px-[6%] py-20">
      <div className="mx-auto mb-12 max-w-xl text-center">
        <p className="mb-3 font-mono text-[13.5px] font-semibold text-cyan-brand">
          CÓMO FUNCIONA
        </p>
        <h2 className="mb-3 font-heading text-3xl font-extrabold tracking-tight text-ink">
          De la mina al pago, en cinco pasos
        </h2>
        <p className="text-[15.5px] text-ink-soft">
          Cada lote pasa por el mismo proceso, sin atajos.
        </p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 rounded-[20px] border border-line bg-slate-panel p-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:p-12">
        {PASOS.map((paso, i) => (
          <Reveal key={paso.n} delay={i * 80}>
            <div
              className={`h-full px-0 lg:px-5 ${
                i > 0 ? "lg:border-l lg:border-line" : ""
              }`}
            >
              <p className="mb-2.5 font-mono text-[13px] font-bold text-cyan-brand">{paso.n}</p>
              <h3 className="mb-1.5 font-heading text-sm font-semibold text-ink">{paso.title}</h3>
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{paso.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- plataforma: split blocks ---------- */

function PlatformSplits() {
  return (
    <section id="plataforma" className="px-[6%] pb-4 pt-16">
      <Reveal className="mx-auto mb-24 grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-[13.5px] font-semibold text-cyan-brand">
            VALIDACIÓN POR IA
          </p>
          <h3 className="mb-3.5 font-heading text-[26px] font-extrabold text-ink">
            Cada lote se revisa <span className="text-cyan-brand">antes</span> de llegar
            al comprador
          </h3>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Nuestro agente compara la pureza declarada, el peso y el puerto de origen
            contra el certificado SGS o Alex Stewart cargado. Si algo no cuadra, el
            lote se queda en revisión — no llega al marketplace por error.
          </p>
        </div>
        <PlaceholderPhoto label="Documentos validados automáticamente" className="h-[280px]" />
      </Reveal>

      <Reveal className="mx-auto mb-24 grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div className="md:order-2">
          <p className="mb-3 font-mono text-[13.5px] font-semibold text-cyan-brand">
            FIDEICOMISO
          </p>
          <h3 className="mb-3.5 font-heading text-[26px] font-extrabold text-ink">
            El pago queda protegido{" "}
            <span className="text-cyan-brand">hasta que el embarque se confirma</span>
          </h3>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Los fondos del comprador se depositan vía STP y solo se liberan al minero
            cuando el Bill of Lading queda confirmado a bordo. Ninguna de las dos
            partes se queda expuesta.
          </p>
        </div>
        <PlaceholderPhoto label="Pago protegido en Escrow" deep className="h-[280px] md:order-1" />
      </Reveal>

      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {[
          {
            icon: "$",
            title: "Precio LME",
            desc: "Cada oferta se ancla al spot de cobre del día, sin negociar a ciegas.",
          },
          {
            icon: "%",
            title: "Comisión clara",
            desc: "2% sobre el valor del lote, cobrado solo al liberar el Escrow.",
          },
          {
            icon: "✓",
            title: "Trazabilidad total",
            desc: "Cada documento y validación queda registrado y es auditable.",
          },
        ].map((card, i) => (
          <Reveal key={card.title} delay={i * 100}>
            <div className="h-full rounded-2xl border border-line bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-brand hover:shadow-[0_16px_30px_-18px_rgba(36,26,20,0.25)]">
              <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-cyan-brand/10 text-lg font-bold text-gold-brand">
                {card.icon}
              </div>
              <h4 className="mb-2 font-heading text-[16.5px] font-semibold text-ink">
                {card.title}
              </h4>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">{card.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- cta + footer ---------- */

function CtaFooter() {
  return (
    <>
      <div className="bg-slate-panel px-[6%] py-24 text-center">
        <h2 className="mb-3.5 font-heading text-3xl font-extrabold text-ink">
          ¿Listo para tu primer lote?
        </h2>
        <p className="mb-7 text-[15.5px] text-ink-soft">
          Publícalo hoy o revisa lo que ya está disponible en el Marketplace.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/minero" className="btn-primary text-sm">
            Publicar un Lote
          </Link>
          <Link href="/comprador/catalogo" className="btn-secondary text-sm">
            Ver Marketplace
          </Link>
        </div>
      </div>
      <footer className="border-t border-line px-[6%] py-8 text-center text-[12.5px] text-ink-soft">
        NEXUS NODE — Marketplace de cobre certificado
      </footer>
    </>
  );
}

/* ---------- page ---------- */

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <Hero />
      <TrustBar />
      <ComoFunciona />
      <PlatformSplits />
      <CtaFooter />
    </div>
  );
}
