import { generateTermSheet } from "@/lib/contracts/generateTermSheet";

export async function POST(req: Request) {
  try {
    const { dealId } = await req.json();

    if (!dealId) {
      return Response.json({ error: "Falta dealId" }, { status: 400 });
    }

    const resultado = await generateTermSheet(dealId);
    return Response.json(resultado);
  } catch (error: any) {
    return Response.json({ error: error.message ?? "Error al generar el term sheet" }, { status: 500 });
  }
}
