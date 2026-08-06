"use client";

import Link from "next/link";
import Image from "next/image";
import { Fraunces, Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

/* ---------- palette (scoped to this page, same hexes as before) ---------- */
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

/* ---------- entrance fade (mount-triggered) ---------- */

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
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDuration: "900ms", transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- scroll reveal: fade + gentle scale, Medvi-style ---------- */

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
      className={`transition-all duration-[900ms] ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!scale-100 motion-reduce:!translate-y-0 ${
        visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-[0.98] opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- placeholder photography ---------- */

function PlaceholderPhoto({
  label,
  image,
  deep = false,
  className = "",
  style,
}: {
  label: string;
  image?: string;
  deep?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden rounded-[28px] p-5 ${className}`}
      style={{
        background: image
          ? undefined
          : deep
          ? `linear-gradient(150deg, #E7CBAE, #B97D46 58%, ${C.copperDark})`
          : `linear-gradient(150deg, #F3D9BC, #D99B5E 58%, ${C.copper})`,
        ...style,
      }}
    >
      {image && (
        <>
          {/* next/image: sirve WebP/AVIF y el tamaño correcto según el
              viewport automáticamente, en vez de bajar el JPG completo de
              Unsplash como hacía el CSS background-image de antes. */}
          <Image
            src={image}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, rgba(20,12,6,0.55), rgba(20,12,6,0.05) 55%)" }}
          />
        </>
      )}
      <span
        className="relative z-10 rounded-full px-3 py-1.5 text-[12px] font-medium tracking-wide"
        style={{ background: "rgba(255,255,255,0.9)", color: C.ink, fontFamily: "var(--font-sans)" }}
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
      className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[14.5px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: C.copper, fontFamily: "var(--font-sans)" }}
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
      className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[14.5px] font-medium transition-all duration-300 hover:-translate-y-0.5"
      style={{ color: C.ink, fontFamily: "var(--font-sans)" }}
    >
      {children} →
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group relative text-[14px] font-medium transition-colors"
      style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}
    >
      {children}
      <span
        className="absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full"
        style={{ background: C.copper }}
      />
    </a>
  );
}

/* ---------- sesión / saludo ---------- */

function primerNombre(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  if (!user) return "";
  const nombreCompleto =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.email ? user.email.split("@")[0] : "");
  const primero = nombreCompleto.trim().split(/\s+/)[0] || "Usuario";
  return primero.charAt(0).toUpperCase() + primero.slice(1);
}

function AccountMenu() {
  const router = useRouter();
  const [nombre, setNombre] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setNombre(data.session?.user ? primerNombre(data.session.user) : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setNombre(session?.user ? primerNombre(session.user) : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setAbierto(false);
    router.push("/");
  };

  if (nombre === null) {
    return <BtnGhost href="/login">Iniciar sesión</BtnGhost>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03]"
        style={{ color: C.ink, fontFamily: "var(--font-sans)" }}
      >
        Hola, {nombre}
        <span className="text-[10px]" style={{ color: C.inkSoft }}>▾</span>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border bg-white py-1.5 shadow-lg"
            style={{ borderColor: C.line }}
          >
            <Link
              href="/comprador/catalogo"
              className="block px-4 py-2.5 text-sm hover:bg-[#FBF6F0]"
              style={{ color: C.ink, fontFamily: "var(--font-sans)" }}
              onClick={() => setAbierto(false)}
            >
              Ver Marketplace
            </Link>
            <Link
              href="/minero"
              className="block px-4 py-2.5 text-sm hover:bg-[#FBF6F0]"
              style={{ color: C.ink, fontFamily: "var(--font-sans)" }}
              onClick={() => setAbierto(false)}
            >
              Publicar un lote
            </Link>
            <button
              onClick={cerrarSesion}
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#FBF6F0]"
              style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- nav ---------- */

function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-[6%] py-6 backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.85)" }}
    >
      <div className="text-[17px] font-semibold tracking-tight" style={{ color: C.ink, fontFamily: "var(--font-display)" }}>
        Nexus <span style={{ color: C.copper, fontStyle: "italic" }}>Node</span>
      </div>
      <div className="hidden gap-9 md:flex">
        <NavLink href="#como-funciona">Cómo funciona</NavLink>
        <NavLink href="#plataforma">Plataforma</NavLink>
        <Link href="/minero" className="text-[14px] font-medium" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
          Para mineros
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <AccountMenu />
        <BtnPrimary href="/comprador/catalogo">Ver Marketplace</BtnPrimary>
      </div>
    </nav>
  );
}

/* ---------- hero ---------- */

const FEATURES = [
  "Precio indexado a LME",
  "Certificación SGS / Alex Stewart",
  "Pago vía Fideicomiso (STP)",
  "Validación de IA por lote",
];

function Hero() {
  return (
    <div className="px-[6%] pb-16 pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <FadeUp delayMs={50}>
          <p
            className="mb-6 text-[13px] font-medium uppercase tracking-[0.18em]"
            style={{ color: C.copper, fontFamily: "var(--font-sans)" }}
          >
            Marketplace de cobre certificado
          </p>
        </FadeUp>
        <FadeUp delayMs={180}>
          <h1
            className="text-[42px] font-medium leading-[1.08] tracking-tight md:text-[64px]"
            style={{ color: C.ink, fontFamily: "var(--font-display)" }}
          >
            Cobre con papeles
            <br />
            que sí cierran <span style={{ fontStyle: "italic", color: C.copper }}>en aduana</span>
          </h1>
        </FadeUp>
        <FadeUp delayMs={320}>
          <p
            className="mx-auto mb-9 mt-6 max-w-lg text-[16px] leading-relaxed"
            style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}
          >
            Conectamos mineros y compradores internacionales con precios indexados a
            LME, validación de documentos por IA y pago protegido en Fideicomiso.
          </p>
        </FadeUp>
        <FadeUp delayMs={440}>
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <BtnPrimary href="/minero">Publicar un Lote</BtnPrimary>
            <BtnGhost href="/comprador/catalogo">Ver Lotes Disponibles</BtnGhost>
          </div>
        </FadeUp>
        <FadeUp delayMs={550}>
          <div
            className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px]"
            style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}
          >
            {FEATURES.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full" style={{ background: C.line }} />}
                {item}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>

      <FadeUp delayMs={400} className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3">
        <PlaceholderPhoto
          label="Cátodo grado A — 99.95%"
          image="https://images.unsplash.com/photo-1756428785265-aed1117cd42b?auto=format&fit=crop&w=1200&q=70"
          className="col-span-2 h-[220px] md:col-span-1 md:h-[320px]"
        />
        <PlaceholderPhoto
          label="Puerto de Manzanillo"
          image="https://images.unsplash.com/photo-1511578194003-00c80e42dc9b?auto=format&fit=crop&w=1200&q=70"
          className="h-[220px] md:h-[320px]"
        />
        <PlaceholderPhoto
          label="Certificado SGS"
          image="https://images.unsplash.com/photo-1763729805496-b5dbf7f00c79?auto=format&fit=crop&w=1200&q=70"
          className="col-span-2 h-[180px] md:col-span-1 md:h-[320px]"
        />
      </FadeUp>
    </div>
  );
}

/* ---------- cómo funciona: clean numbered list, no boxes ---------- */

const PASOS = [
  { n: "01", title: "Registro", desc: "El minero sube el lote y sus documentos." },
  { n: "02", title: "Validación IA", desc: "Se cruzan certificados, pureza y pedimento." },
  { n: "03", title: "Publicación", desc: "El lote aparece en el Marketplace." },
  { n: "04", title: "Escrow", desc: "El comprador deposita en Fideicomiso." },
  { n: "05", title: "Liberación", desc: "BL confirmado, pago liberado al minero." },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="px-[6%] py-28">
      <Reveal className="mx-auto mb-16 max-w-xl text-center">
        <p
          className="mb-4 text-[13px] font-medium uppercase tracking-[0.18em]"
          style={{ color: C.copper, fontFamily: "var(--font-sans)" }}
        >
          Cómo funciona
        </p>
        <h2
          className="text-[32px] font-medium tracking-tight md:text-[38px]"
          style={{ color: C.ink, fontFamily: "var(--font-display)" }}
        >
          De la mina al pago, en cinco pasos
        </h2>
      </Reveal>
      <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {PASOS.map((paso, i) => (
          <Reveal key={paso.n} delay={i * 90}>
            <div className="pt-6" style={{ borderTop: `1px solid ${C.line}` }}>
              <p className="mb-3 text-[13px] font-medium" style={{ color: C.copper, fontFamily: "var(--font-sans)" }}>
                {paso.n}
              </p>
              <h3
                className="mb-1.5 text-[17px] font-medium"
                style={{ color: C.ink, fontFamily: "var(--font-display)" }}
              >
                {paso.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
                {paso.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- plataforma: big editorial splits ---------- */

function PlatformSplits() {
  return (
    <section id="plataforma" className="px-[6%] pb-8">
      <Reveal className="mx-auto mb-28 grid max-w-5xl items-center gap-16 md:grid-cols-2">
        <PlaceholderPhoto
          label="Documentos validados automáticamente"
          image="https://images.unsplash.com/photo-1586941962765-d3896cc85ac8?auto=format&fit=crop&w=1200&q=70"
          className="h-[340px] order-2 md:order-1"
        />
        <div className="order-1 md:order-2">
          <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.18em]" style={{ color: C.copper, fontFamily: "var(--font-sans)" }}>
            Validación por IA
          </p>
          <h3
            className="mb-4 text-[28px] font-medium leading-tight md:text-[32px]"
            style={{ color: C.ink, fontFamily: "var(--font-display)" }}
          >
            Cada lote se revisa <span style={{ fontStyle: "italic", color: C.copper }}>antes</span> de llegar
            al comprador
          </h3>
          <p className="text-[15px] leading-relaxed" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
            Nuestro agente compara la pureza declarada, el peso y el puerto de origen
            contra el certificado SGS o Alex Stewart cargado. Si algo no cuadra, el
            lote se queda en revisión — no llega al marketplace por error.
          </p>
        </div>
      </Reveal>

      <Reveal className="mx-auto mb-28 grid max-w-5xl items-center gap-16 md:grid-cols-2">
        <div>
          <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.18em]" style={{ color: C.copper, fontFamily: "var(--font-sans)" }}>
            Fideicomiso
          </p>
          <h3
            className="mb-4 text-[28px] font-medium leading-tight md:text-[32px]"
            style={{ color: C.ink, fontFamily: "var(--font-display)" }}
          >
            El pago queda protegido{" "}
            <span style={{ fontStyle: "italic", color: C.copper }}>hasta que el embarque se confirma</span>
          </h3>
          <p className="text-[15px] leading-relaxed" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
            Los fondos del comprador se depositan vía STP y solo se liberan al minero
            cuando el Bill of Lading queda confirmado a bordo. Ninguna de las dos
            partes se queda expuesta.
          </p>
        </div>
        <PlaceholderPhoto
          label="Pago protegido en Escrow"
          image="https://images.unsplash.com/photo-1681505531034-8d67054e07f6?auto=format&fit=crop&w=1200&q=70"
          className="h-[340px]"
        />
      </Reveal>

      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
        {[
          { mark: "01", title: "Precio LME", desc: "Cada oferta se ancla al spot de cobre del día, sin negociar a ciegas." },
          { mark: "02", title: "Comisión clara", desc: "2% sobre el valor del lote, cobrado solo al liberar el Escrow." },
          { mark: "03", title: "Trazabilidad total", desc: "Cada documento y validación queda registrado y es auditable." },
        ].map((card, i) => (
          <Reveal key={card.title} delay={i * 100}>
            <p className="mb-3 text-[13px] font-medium" style={{ color: C.copper, fontFamily: "var(--font-sans)" }}>
              {card.mark}
            </p>
            <h4 className="mb-2 text-[18px] font-medium" style={{ color: C.ink, fontFamily: "var(--font-display)" }}>
              {card.title}
            </h4>
            <p className="text-[14px] leading-relaxed" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
              {card.desc}
            </p>
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
      <Reveal className="px-[6%] py-28 text-center">
        <h2
          className="mx-auto mb-5 max-w-lg text-[36px] font-medium leading-tight md:text-[44px]"
          style={{ color: C.ink, fontFamily: "var(--font-display)" }}
        >
          ¿Listo para tu <span style={{ fontStyle: "italic", color: C.copper }}>primer lote</span>?
        </h2>
        <p className="mb-9 text-[15.5px]" style={{ color: C.inkSoft, fontFamily: "var(--font-sans)" }}>
          Publícalo hoy o revisa lo que ya está disponible en el Marketplace.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <BtnPrimary href="/minero">Publicar un Lote</BtnPrimary>
          <BtnGhost href="/comprador/catalogo">Ver Marketplace</BtnGhost>
        </div>
      </Reveal>
      <footer
        className="px-[6%] py-8 text-center text-[13px]"
        style={{ borderTop: `1px solid ${C.line}`, color: C.inkSoft, fontFamily: "var(--font-sans)" }}
      >
        Nexus Node — Marketplace de cobre certificado
      </footer>
    </>
  );
}

/* ---------- page ---------- */

export default function HomePage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} relative min-h-screen`}
      style={{ background: C.bg, color: C.ink, fontFamily: "var(--font-sans), sans-serif" }}
    >
      <Nav />
      <Hero />
      <ComoFunciona />
      <PlatformSplits />
      <CtaFooter />
    </div>
  );
}
