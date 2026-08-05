"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fraunces } from "next/font/google";
import { supabase } from "@/lib/supabase";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const displayFont = { fontFamily: "var(--font-display)" } as const;

function Bienvenida() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/comprador/catalogo";
  const [estado, setEstado] = useState<"verificando" | "ok" | "error">("verificando");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? "ok" : "error");
    });
  }, []);

  if (estado === "verificando") {
    return <p className="text-sm text-[#75604F]">Confirmando tu cuenta...</p>;
  }

  if (estado === "error") {
    return (
      <>
        <h1 className="text-xl font-medium text-[#241A14] mb-2" style={displayFont}>
          El enlace ya expiró o no es válido
        </h1>
        <p className="text-sm text-[#75604F] mb-6">Intenta iniciar sesión directamente.</p>
        <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-[#B15A2A] hover:bg-[#8C4620] text-white text-sm font-medium px-6 py-3 transition-colors">
          Ir a iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
      <h1 className="text-xl font-medium text-[#241A14] mb-2" style={displayFont}>¡Cuenta confirmada!</h1>
      <p className="text-sm text-[#75604F] mb-6">Ya puedes comprar y, cuando quieras, publicar lotes para vender.</p>
      <Link href={redirectTo} className="inline-flex items-center justify-center rounded-full bg-[#B15A2A] hover:bg-[#8C4620] text-white text-sm font-medium px-6 py-3 transition-colors">
        Continuar
      </Link>
    </>
  );
}

export default function BienvenidaPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-8">
        <Suspense fallback={<p className="text-sm text-[#75604F]">Cargando...</p>}>
          <Bienvenida />
        </Suspense>
      </div>
    </div>
  );
}
