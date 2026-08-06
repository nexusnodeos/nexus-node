"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fraunces, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const displayFont = { fontFamily: "var(--font-display)" } as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/comprador/catalogo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(redirectTo);
    } catch (err: any) {
      setError(
        err.message === "Email not confirmed"
          ? "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
          : "Correo o contraseña incorrectos."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-medium text-[#241A14] mb-1" style={displayFont}>Inicia sesión</h1>
      <p className="text-sm text-[#75604F] mb-6">Con tu misma cuenta puedes comprar y publicar lotes.</p>

      <GoogleAuthButton redirectTo={redirectTo} />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#E9DFD2]" />
        <span className="text-xs text-[#8A7561]">o con tu correo</span>
        <div className="flex-1 h-px bg-[#E9DFD2]" />
      </div>

      <form onSubmit={manejarLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-[#B15A2A] hover:bg-[#8C4620] text-white font-medium text-sm py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-xs text-[#8A7561] mt-6 text-center">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro?redirect=${encodeURIComponent(redirectTo)}`} className="text-[#B15A2A] font-medium hover:underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className={`${display.variable} ${sans.variable} min-h-screen bg-white flex items-center justify-center p-6`} style={{ fontFamily: "var(--font-sans)" }}>
      <div className="w-full max-w-sm bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
