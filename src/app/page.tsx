import Link from "next/link";

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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-panel sticky top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <NexusLogo />
        <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          Protocolo Zero-Trust v1.0
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 md:px-10">
        <div className="w-full max-w-4xl space-y-10 text-center">
          <div
            className="fade-up inline-flex items-center gap-2 rounded-full border border-cyan-brand/30 bg-cyan-brand/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan-brand"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-brand" />
            Infraestructura Institucional
          </div>

          <h1
            className="fade-up font-heading text-4xl font-bold leading-tight text-ink md:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.15s" }}
          >
            Nexus Node
            <span className="mt-2 block text-2xl font-semibold text-gold-brand md:text-3xl lg:text-4xl">
              Protocolo Zero-Trust
            </span>
          </h1>

          <p
            className="fade-up mx-auto max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl"
            style={{ animationDelay: "0.25s" }}
          >
            Plataforma de gobernanza para validación criptográfica de lotes de
            cobre en puertos LATAM. Eliminamos intermediación opaca mediante
            fideicomisos, trazabilidad aduanal y liquidación en 72 horas.
          </p>

          <div
            className="fade-up flex flex-col items-center justify-center gap-4 sm:flex-row"
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

        <section className="mt-24 grid w-full max-w-5xl gap-6 md:grid-cols-3">
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
            <article
              key={item.title}
              className="fade-up glass-panel rounded-xl p-6 text-left transition-all hover:-translate-y-1 hover:border-gold-brand/40 hover:shadow-[0_16px_30px_-18px_rgba(36,26,20,0.25)]"
              style={{ animationDelay: `${0.45 + i * 0.1}s` }}
            >
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
          ))}
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center font-mono text-xs text-ink-soft md:px-10">
        NEXUS NODE OS · Infraestructura Financiera para Commodities
      </footer>
    </div>
  );
}
