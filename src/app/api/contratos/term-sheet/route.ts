import { generateTermSheet } from "@/lib/contracts/generateTermSheet";

export async function POST(req: Request) {
  try {
    const { loteId } = await req.json();

    if (!loteId) {
      return Response.json({ error: "Falta loteId" }, { status: 400 });
    }

    const resultado = await generateTermSheet(loteId);
    return Response.json(resultado);
  } catch (error: any) {
    return Response.json({ error: error.message ?? "Error al generar el term sheet" }, { status: 500 });
  }
}
