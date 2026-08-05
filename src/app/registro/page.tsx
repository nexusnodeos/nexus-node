"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fraunces } from "next/font/google";
import { supabase } from "@/lib/supabase";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const displayFont = { fontFamily: "var(--font-display)" } as const;

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/comprador/catalogo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentaCreada, setCuentaCreada] = useState(false);

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/bienvenida?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        // La confirmación de correo está desactivada en este ambiente: ya hay sesión activa.
        router.push(redirectTo);
        return;
      }

      setCuentaCreada(true);
    } catch (err: any) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  };

  const reenviarConfirmacion = async () => {
    setEnviando(true);
    try {
      await supabase.auth.resend({ type: "signup", email });
      setError(null);
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar el correo.");
    } finally {
      setEnviando(false);
    }
  };

  if (cuentaCreada) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
        <h1 className="text-xl font-medium text-[#241A14] mb-2" style={displayFont}>Revisa tu correo</h1>
        <p className="text-sm text-[#75604F] leading-relaxed mb-6">
          Te enviamos un enlace de confirmación a <strong className="text-[#241A14]">{email}</strong>.
          Ábrelo para activar tu cuenta.
        </p>
        <button
          onClick={reenviarConfirmacion}
          disabled={enviando}
          className="text-xs text-[#B15A2A] font-medium hover:underline disabled:opacity-50"
        >
          {enviando ? "Reenviando..." : "Reenviar correo de confirmación"}
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-medium text-[#241A14] mb-1" style={displayFont}>Crea tu cuenta</h1>
      <p className="text-sm text-[#75604F] mb-6">Con una sola cuenta puedes comprar y, cuando quieras, publicar lotes para vender.</p>

      <GoogleAuthButton redirectTo={redirectTo} />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#E9DFD2]" />
        <span className="text-xs text-[#8A7561]">o con tu correo</span>
        <div className="flex-1 h-px bg-[#E9DFD2]" />
      </div>

      <form onSubmit={manejarRegistro} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
            placeholder="tu@empresa.com"
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
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#75604F] uppercase mb-1">Confirmar contraseña</label>
          <input
            type="password"
            required
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full bg-white border border-[#E9DFD2] rounded-xl px-3 py-2.5 text-[#241A14] focus:outline-none focus:border-[#B15A2A]"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-[#B15A2A] hover:bg-[#8C4620] text-white font-medium text-sm py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-xs text-[#8A7561] mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-[#B15A2A] font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#FBF6F0] border border-[#E9DFD2] rounded-2xl p-8">
        <Suspense fallback={null}>
          <RegistroForm />
        </Suspense>
      </div>
    </div>
  );
}
