// src/lib/contracts/sanitizacionPdf.ts
//
// Hallazgo de QA (2026-08-04, scripts/qa_inyeccion_plantillas.ts):
// 1) Un valor controlado por el usuario (ej. nombre de empresa) que contenga
//    literalmente "{{" o "}}" no causa doble-sustitución, pero SÍ deja ese
//    texto visible en el PDF legal final, aparentando ser sintaxis de plantilla.
// 2) pdf-lib con StandardFonts (WinAnsi) truena por completo si el texto trae
//    un caracter fuera de ese set (emoji, chino, cirílico, etc.) — grave para
//    una plataforma que busca compradores internacionales.
//
// Este módulo sanea ambos casos ANTES de dibujar cualquier texto en el PDF.

import type { PDFFont } from "pdf-lib";

/**
 * Rompe cualquier secuencia "{{" o "}}" que venga dentro de un valor de
 * usuario, para que nunca pueda aparentar ser sintaxis de la plantilla
 * ({{variable}}) dentro del documento legal generado.
 */
export function sanearContraInyeccionLlaves(valor: string): string {
  return valor.replace(/\{\{/g, "{ {").replace(/\}\}/g, "} }");
}

/**
 * Reemplaza cada caracter que la fuente WinAnsi (StandardFonts.Helvetica /
 * HelveticaBold) no pueda codificar por "?", en vez de dejar que pdf-lib
 * truene toda la generación del documento. Se usa el font ya embebido para
 * probar caracter por caracter — así queda atado a lo que pdf-lib realmente
 * soporta, no a un rango de Unicode adivinado.
 */
export function sanearParaWinAnsi(font: PDFFont, texto: string): string {
  let resultado = "";
  for (const char of texto) {
    try {
      font.widthOfTextAtSize(char, 1);
      resultado += char;
    } catch {
      resultado += "?";
    }
  }
  return resultado;
}
