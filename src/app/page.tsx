"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-landing",
});

/* ---------- palette (scoped to this page only, matches the v4 mock) ---------- */
const C = {
  ink: "#241A14",
  inkSoft: "#75604F",
  bg: "#FFFFFF",
  bgSoft: "#FBF6F0",
  line: "#E9DFD2",
  copper: "#B15A2A",
  copperDark: "#8C4620",
  copperBg: "#F7E5D3",
};

/* ---------- entrance fade (mount-triggered, no global keyframes needed) ---------- */

function FadeUp({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`transition-all ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
        shown ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"
      } ${className}`}
      style={{ transitionDuration: "700ms", transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- scroll reveal ---------- */

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
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
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
      className={`relative flex items-end overflow-hidden rounded-2xl border p-4 ${className}`}
      style={{
        borderColor: C.line,
        background: deep
          ? `linear-gradient(140deg, #E7CBAE, #B97D46 60%, ${C.copperDark})`
          : `linear-gradient(140deg, #F3D9BC, #D99B5E 60%, ${C.copper})`,
        ...style,
      }}
    >
      <span
        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
        style={{ background: "rgba(255,255,255,0.8)", color: C.ink }}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------- buttons ---------- */

function BtnPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      style={{ background: C.copper }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.copperDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.copper)}
    >
      {children}
    </Link>
  );
}

function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border px-5 py-[11px] text-sm font-semibold transition-transform hover:-translate-y-0.5"
      style={{ borderColor: C.line, color: C.ink }}
    >
      {children}
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group relative text-[14.5px] font-medium transition-colors"
      style={{ color: C.inkSoft }}
    >
      {children}
      <span
        className="absolute -bottom-1 left-0 h-[2px] w-0 transition-all duration-200 group-hover:w-full"
        style={{ background: C.copper }}
      />
    </a>
  );
}

/* ---------- nav ---------- */

function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-[6%] py-5 backdrop-blur-md"
      style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.92)" }}
    >
      <div className="text-lg font-extrabold tracking-tight" style={{ color: C.ink }}>
        NEXUS<span style={{ color: C.copper }}>NODE</span>
      </div>
      <div className="hidden gap-8 md:flex">
        <NavLink href="#como-funciona">Cómo funciona</NavLink>
        <NavLink href="#plataforma">Plataforma</NavLink>
        <Link href="/minero" className="group relative text-[14.5px] font-medium transition-colors" style={{ color: C.inkSoft }}>
          Para mineros
        </Link>
      </div>
      <div className="flex gap-2.5">
        <BtnGhost href="/minero">Iniciar sesión</BtnGhost>
        <BtnPrimary href="/comprador/catalogo">Ver Marketplace</BtnPrimary>
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
        <FadeUp delayMs={50}>
          <p className="mb-4 text-[13.5px] font-semibold" style={{ color: C.copper }}>
            MARKETPLACE DE COBRE CERTIFICADO
          </p>
        </FadeUp>
        <FadeUp delayMs={150}>
          <h1
            className="text-4xl font-extrabold leading-[1.12] tracking-tight md:text-5xl"
            style={{ color: C.ink }}
          >
            Vende y compra cobre{" "}
            <span style={{ color: C.copper }}>con papeles que sí cierran</span> en aduana
          </h1>
        </FadeUp>
        <FadeUp delayMs={250}>
          <p className="mb-7 mt-4 max-w-md text-base leading-relaxed" style={{ color: C.inkSoft }}>
            Conectamos mineros y compradores internacionales con precios indexados a
            LME, validación de documentos por IA y pago protegido en Fideicomiso.
          </p>
        </FadeUp>
        <FadeUp delayMs={350}>
          <div className="mb-7 flex flex-wrap gap-3">
            <BtnPrimary href="/minero">Publicar un Lote</BtnPrimary>
            <BtnGhost href="/comprador/catalogo">Ver Lotes Disponibles</BtnGhost>
          </div>
        </FadeUp>
        <FadeUp delayMs={450}>
          <div className="grid max-w-md grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {CHECKLIST.map((item) => (
              <div key={item} className="group flex items-center gap-2.5 text-sm" style={{ color: C.inkSoft }}>
                <span
                  className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-full text-[11px] transition-transform group-hover:scale-110"
                  style={{ background: C.copperBg, color: C.copperDark }}
                >
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <FadeUp delayMs={300} className="col-span-2">
          <PlaceholderPhoto label="Cátodo de cobre grado A — 99.95%" className="h-[190px]" />
        </FadeUp>
        <FadeUp delayMs={420}>
          <PlaceholderPhoto label="Puerto de Manzanillo" deep className="h-[150px]" />
        </FadeUp>
        <FadeUp delayMs={540}>
          <PlaceholderPhoto label="Certificado SGS" className="h-[150px]" />
        </FadeUp>
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
    <div
      className="flex flex-wrap items-center justify-center gap-x-11 gap-y-3 px-[6%] py-6"
      style={{ background: C.bgSoft, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
    >
      {TRUST_ITEMS.map((item) => (
        <div key={item} className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.inkSoft }}>
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
        <p className="mb-3 text-[13.5px] font-semibold" style={{ color: C.copper }}>
          CÓMO FUNCIONA
        </p>
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight" style={{ color: C.ink }}>
          De la mina al pago, en cinco pasos
        </h2>
        <p className="text-[15.5px]" style={{ color: C.inkSoft }}>
          Cada lote pasa por el mismo proceso, sin atajos.
        </p>
      </div>
      <div
        className="mx-auto grid max-w-6xl gap-5 rounded-[20px] p-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:p-12"
        style={{ background: C.bgSoft, border: `1px solid ${C.line}` }}
      >
        {PASOS.map((paso, i) => (
          <Reveal key={paso.n} delay={i * 80}>
            <div
              className="h-full px-0 lg:px-5"
              style={i > 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
            >
              <p className="mb-2.5 text-[13px] font-bold" style={{ color: C.copper }}>{paso.n}</p>
              <h3 className="mb-1.5 text-sm font-semibold" style={{ color: C.ink }}>{paso.title}</h3>
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>{paso.desc}</p>
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
          <p className="mb-3 text-[13.5px] font-semibold" style={{ color: C.copper }}>
            VALIDACIÓN POR IA
          </p>
          <h3 className="mb-3.5 text-[26px] font-extrabold" style={{ color: C.ink }}>
            Cada lote se revisa <span style={{ color: C.copper }}>antes</span> de llegar al
            comprador
          </h3>
          <p className="text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            Nuestro agente compara la pureza declarada, el peso y el puerto de origen
            contra el certificado SGS o Alex Stewart cargado. Si algo no cuadra, el
            lote se queda en revisión — no llega al marketplace por error.
          </p>
        </div>
        <PlaceholderPhoto label="Documentos validados automáticamente" className="h-[280px]" />
      </Reveal>

      <Reveal className="mx-auto mb-24 grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div className="md:order-2">
          <p className="mb-3 text-[13.5px] font-semibold" style={{ color: C.copper }}>
            FIDEICOMISO
          </p>
          <h3 className="mb-3.5 text-[26px] font-extrabold" style={{ color: C.ink }}>
            El pago queda protegido{" "}
            <span style={{ color: C.copper }}>hasta que el embarque se confirma</span>
          </h3>
          <p className="text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            Los fondos del comprador se depositan vía STP y solo se liberan al minero
            cuando el Bill of Lading queda confirmado a bordo. Ninguna de las dos
            partes se queda expuesta.
          </p>
        </div>
        <PlaceholderPhoto label="Pago protegido en Escrow" deep className="h-[280px] md:order-1" />
      </Reveal>

      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {[
          { icon: "$", title: "Precio LME", desc: "Cada oferta se ancla al spot de cobre del día, sin negociar a ciegas." },
          { icon: "%", title: "Comisión clara", desc: "2% sobre el valor del lote, cobrado solo al liberar el Escrow." },
          { icon: "✓", title: "Trazabilidad total", desc: "Cada documento y validación queda registrado y es auditable." },
        ].map((card, i) => (
          <Reveal key={card.title} delay={i * 100}>
            <div
              className="group h-full rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1"
              style={{ border: `1px solid ${C.line}`, background: C.bg }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.copper)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
            >
              <div
                className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] text-lg font-bold"
                style={{ background: C.copperBg, color: C.copperDark }}
              >
                {card.icon}
              </div>
              <h4 className="mb-2 text-[16.5px] font-semibold" style={{ color: C.ink }}>
                {card.title}
              </h4>
              <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>{card.desc}</p>
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
      <div className="px-[6%] py-24 text-center" style={{ background: C.bgSoft }}>
        <h2 className="mb-3.5 text-3xl font-extrabold" style={{ color: C.ink }}>
          ¿Listo para tu primer lote?
        </h2>
        <p className="mb-7 text-[15.5px]" style={{ color: C.inkSoft }}>
          Publícalo hoy o revisa lo que ya está disponible en el Marketplace.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <BtnPrimary href="/minero">Publicar un Lote</BtnPrimary>
          <BtnGhost href="/comprador/catalogo">Ver Marketplace</BtnGhost>
        </div>
      </div>
      <footer
        className="px-[6%] py-8 text-center text-[12.5px]"
        style={{ borderTop: `1px solid ${C.line}`, color: C.inkSoft }}
      >
        NEXUS NODE — Marketplace de cobre certificado
      </footer>
    </>
  );
}

/* ---------- page ---------- */

export default function HomePage() {
  return (
    <div
      className={`${poppins.variable} relative min-h-screen`}
      style={{ background: C.bg, color: C.ink, fontFamily: "var(--font-landing), sans-serif" }}
    >
      <Nav />
      <Hero />
      <TrustBar />
      <ComoFunciona />
      <PlatformSplits />
      <CtaFooter />
    </div>
  );
}
