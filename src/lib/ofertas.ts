// src/lib/ofertas.ts
import { supabase } from "@/lib/supabase";

export interface Oferta {
  id: string;
  lote_id: string;
  monto_ofertado: number;
  comprador_email: string;
  estatus: string;
}

export async function obtenerOfertasPorLote(loteId: string) {
  return supabase
    .from("ofertas")
    .select("id, lote_id, monto_ofertado, comprador_email, estatus")
    .eq("lote_id", loteId)
    .order("monto_ofertado", { ascending: false });
}

export async function rechazarOferta(ofertaId: string) {
  return supabase.from("ofertas").update({ estatus: "rechazada" }).eq("id", ofertaId);
}

export async function aceptarOferta(loteId: string, ofertaId: string) {
  const { error: e1 } = await supabase
    .from("ofertas")
    .update({ estatus: "rechazada" })
    .eq("lote_id", loteId)
    .neq("id", ofertaId);
  if (e1) return { error: e1 };

  const { error: e2 } = await supabase
    .from("ofertas")
    .update({ estatus: "aceptada" })
    .eq("id", ofertaId);
  if (e2) return { error: e2 };

  const { error: e3 } = await supabase
    .from("lotes")
    .update({ estatus: "vendido" })
    .eq("id", loteId);
  if (e3) return { error: e3 };

  return { error: null };
}
