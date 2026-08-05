"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.05l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.95l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function GoogleAuthButton({ redirectTo }: { redirectTo: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continuarConGoogle = async () => {
    setCargando(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });
      if (oauthError) throw oauthError;
      // Supabase redirige a Google; el navegador sale de esta página aquí mismo.
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar con Google.");
      setCargando(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={continuarConGoogle}
        disabled={cargando}
        className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-[#FBF6F0] border border-[#E9DFD2] text-[#241A14] font-medium text-sm py-3 rounded-full transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        {cargando ? "Conectando..." : "Continuar con Google"}
      </button>
      {error && <p className="text-xs text-rose-600 mt-2 text-center">{error}</p>}
    </div>
  );
}
