import { firmarContratoExistente } from "@/lib/contracts/estamparFirma";

export async function POST(req: Request) {
  try {
    const { rutaContrato, firmaBase64 } = await req.json();

    if (!rutaContrato || !firmaBase64) {
      return Response.json({ error: "Faltan rutaContrato o firmaBase64" }, { status: 400 });
    }

    const resultado = await firmarContratoExistente(rutaContrato, firmaBase64);
    return Response.json(resultado);
  } catch (error: any) {
    return Response.json({ error: error.message ?? "Error al firmar el contrato" }, { status: 500 });
  }
}
