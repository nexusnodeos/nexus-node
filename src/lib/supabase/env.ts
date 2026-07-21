type SupabaseEnvStatus = {
  urlPresent: boolean;
  anonKeyPresent: boolean;
  urlPreview: string | null;
  isConfigured: boolean;
};

function maskValue(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length <= 12) return "••••••••";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    urlPresent: Boolean(url),
    anonKeyPresent: Boolean(anonKey),
    urlPreview: maskValue(url),
    isConfigured: Boolean(url && anonKey),
  };
}

export function getSupabaseConfigError(): string | null {
  const status = getSupabaseEnvStatus();

  if (!status.urlPresent && !status.anonKeyPresent) {
    return "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.";
  }
  if (!status.urlPresent) {
    return "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local.";
  }
  if (!status.anonKeyPresent) {
    return "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.";
  }

  return null;
}
