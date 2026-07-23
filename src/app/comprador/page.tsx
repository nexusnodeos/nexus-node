import { redirect } from 'next/navigation';

// Unificado en la Tarea 1.03: existian dos catalogos de comprador (este, con datos reales de
// Supabase, y /comprador/catalogo, con MOCK_LOTS hardcodeado). El catalogo con datos reales
// (y el flujo NCNDA/POF de revelacion progresiva) ahora vive en /comprador/catalogo.
export default function CompradorRedirect() {
  redirect('/comprador/catalogo');
}
