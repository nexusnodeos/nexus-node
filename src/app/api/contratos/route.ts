import { generarContratoPdf } from "@/lib/contracts/generarContratoPdf";

export async function POST(req: Request) {
  try {
    const { loteId } = await req.json();

    if (!loteId) {
      return Response.json({ error: "Falta loteId" }, { status: 400 });
    }

    const resultado = await generarContratoPdf(loteId);
    return Response.json(resultado);
  } catch (error: any) {
    return Response.json({ error: error.message ?? "Error al generar el contrato" }, { status: 500 });
  }
}
