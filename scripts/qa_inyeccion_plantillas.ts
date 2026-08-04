import { PDFDocument, StandardFonts } from "pdf-lib";
import { renderizarPlantilla, RESERVA_TEMPLATE } from "../src/lib/contracts/plantillas";
import { sanearContraInyeccionLlaves, sanearParaWinAnsi } from "../src/lib/contracts/sanitizacionPdf";

// NOTA (fix 2026-08-04): este script antes probaba renderizarPlantilla() en
// crudo, sin pasar por el saneamiento que ahora sí aplica generarContratoPdf.ts
// en producción. Se actualizó para ejercitar el pipeline REAL (sanear -> 
// renderizar -> sanear WinAnsi -> dibujar), para que siga siendo una prueba
// de regresión fiel a lo que corre en producción.

interface CasoPrueba {
  nombre: string;
  variables: Record<string, string | number>;
}

const CASOS: CasoPrueba[] = [
  {
    nombre: "Normal (control)",
    variables: { loteId: "abc123", vendedorIdCodificado: "VENDEDOR-ABC123", mineral: "Cobre", toneladas: 500, purezaPorcentaje: 99, compradorIdCodificado: "COMPRADOR-00001", pofEstatus: "Verificado", fechaReserva: "hoy", fechaExpiracion72h: "en 72h", montoOfertadoUsd: "1,000,000", periodoProteccionMeses: 24, porcentajePenalizacionTotal: 50, porcentajeVendedor: 25, porcentajeComprador: 25, interesMoratorioMensual: 2, diaInicioInteres: 11, comisionMinimaPct: 2, comisionMaximaPct: 5, fechaGeneracion: "hoy" },
  },
  {
    nombre: "Inyeccion de llaves {{ }} en nombre de empresa (intento de falsificar otra clausula)",
    variables: { loteId: "abc123", vendedorIdCodificado: "Empresa Legit}} CLAUSULA FALSA: comision es 0% {{ignorar", mineral: "Cobre", toneladas: 500, purezaPorcentaje: 99, compradorIdCodificado: "COMPRADOR-00001", pofEstatus: "Verificado", fechaReserva: "hoy", fechaExpiracion72h: "en 72h", montoOfertadoUsd: "1,000,000", periodoProteccionMeses: 24, porcentajePenalizacionTotal: 50, porcentajeVendedor: 25, porcentajeComprador: 25, interesMoratorioMensual: 2, diaInicioInteres: 11, comisionMinimaPct: 2, comisionMaximaPct: 5, fechaGeneracion: "hoy" },
  },
  {
    nombre: "Emoji en nombre de empresa (rompe fuente WinAnsi)",
    variables: { loteId: "abc123", vendedorIdCodificado: "Cobre del Norte 🚀🔥", mineral: "Cobre", toneladas: 500, purezaPorcentaje: 99, compradorIdCodificado: "COMPRADOR-00001", pofEstatus: "Verificado", fechaReserva: "hoy", fechaExpiracion72h: "en 72h", montoOfertadoUsd: "1,000,000", periodoProteccionMeses: 24, porcentajePenalizacionTotal: 50, porcentajeVendedor: 25, porcentajeComprador: 25, interesMoratorioMensual: 2, diaInicioInteres: 11, comisionMinimaPct: 2, comisionMaximaPct: 5, fechaGeneracion: "hoy" },
  },
  {
    nombre: "Caracteres chinos/cirilicos (rompe fuente WinAnsi)",
    variables: { loteId: "abc123", vendedorIdCodificado: "铜矿石公司 Медь ООО", mineral: "Cobre", toneladas: 500, purezaPorcentaje: 99, compradorIdCodificado: "COMPRADOR-00001", pofEstatus: "Verificado", fechaReserva: "hoy", fechaExpiracion72h: "en 72h", montoOfertadoUsd: "1,000,000", periodoProteccionMeses: 24, porcentajePenalizacionTotal: 50, porcentajeVendedor: 25, porcentajeComprador: 25, interesMoratorioMensual: 2, diaInicioInteres: 11, comisionMinimaPct: 2, comisionMaximaPct: 5, fechaGeneracion: "hoy" },
  },
  {
    nombre: "Cadena extremadamente larga (10,000 caracteres) en un campo",
    variables: { loteId: "abc123", vendedorIdCodificado: "A".repeat(10000), mineral: "Cobre", toneladas: 500, purezaPorcentaje: 99, compradorIdCodificado: "COMPRADOR-00001", pofEstatus: "Verificado", fechaReserva: "hoy", fechaExpiracion72h: "en 72h", montoOfertadoUsd: "1,000,000", periodoProteccionMeses: 24, porcentajePenalizacionTotal: 50, porcentajeVendedor: 25, porcentajeComprador: 25, interesMoratorioMensual: 2, diaInicioInteres: 11, comisionMinimaPct: 2, comisionMaximaPct: 5, fechaGeneracion: "hoy" },
  },
  {
    nombre: "Variable faltante (debe mostrar [[nombre]], no tronar)",
    variables: { loteId: "abc123", mineral: "Cobre", toneladas: 500 },
  },
];

async function probarCaso(caso: CasoPrueba) {
  try {
    // Aplica el mismo saneamiento contra inyección de llaves que
    // construirVariables() en generarContratoPdf.ts aplica a campos de usuario.
    const variablesSaneadas = { ...caso.variables };
    if (typeof variablesSaneadas.vendedorIdCodificado === "string") {
      variablesSaneadas.vendedorIdCodificado = sanearContraInyeccionLlaves(
        variablesSaneadas.vendedorIdCodificado
      );
    }

    const textoRenderizado = renderizarPlantilla(RESERVA_TEMPLATE, variablesSaneadas);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Mismo saneamiento WinAnsi que generarPdfBase() aplica antes de dibujar.
    const textoSaneado = sanearParaWinAnsi(font, textoRenderizado);

    const lineas = textoSaneado.split("\n");
    let y = 740;
    for (const linea of lineas) {
      if (linea.length === 0) continue;
      page.drawText(linea.slice(0, 100), { x: 60, y, size: 9, font });
      y -= 12;
      if (y < 40) break; // solo probamos que no truene, no el paginado completo
    }

    await pdfDoc.save();

    const contieneInyeccionLlaves = /\{\{|\}\}/.test(
      textoSaneado.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, "")
    );

    console.log(`✅ ${caso.nombre}`);
    if (contieneInyeccionLlaves) {
      console.log(`   ⚠️  El texto final SIGUE conteniendo {{ o }} sin resolver -- revisar saneamiento.`);
    }
  } catch (err) {
    console.log(`🚨 ${caso.nombre} -- FALLÓ:`);
    console.log(`   ${(err as Error).message}`);
  }
}

async function correr() {
  console.log("Probando el motor de plantillas contra casos adversariales...\n");
  for (const caso of CASOS) {
    await probarCaso(caso);
  }
}

correr();
