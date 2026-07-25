// src/lib/contracts/plantillas.ts
//
// Tarea 1.8: motor de variables dinamicas para PDF. Estas plantillas
// (Etapa 1 = Reserva/NCNDA con identidad codificada, Etapa 2 = Compraventa
// Final con identidad revelada) son las mismas descritas en
// src/docs/prompts/1.2-plantillas-contrato.md. generarContratoPdf.ts las
// rellena con datos reales y las dibuja en el PDF con salto de linea
// automatico, en vez de tener cada campo escrito a mano.

export const RESERVA_TEMPLATE = `CONTRATO DE RESERVA DE EXCLUSIVIDAD DE 72 HORAS
Y ACUERDO DE NO REVELACION Y NO CIRCUNVENCION (NCNDA)

Plataforma: Nexus Node OS
Referencia de Lote: {{loteId}}
Fecha de Reserva: {{fechaReserva}}
Fecha de Expiracion de Exclusividad: {{fechaExpiracion72h}}

PARTES (IDENTIDADES CODIFICADAS)

Nexus Node es depositario de la identidad real de ambas partes hasta la Etapa 2 de este acuerdo.

EL VENDEDOR: identificado como "{{vendedorIdCodificado}}", titular verificado de un lote de {{mineral}} de {{toneladas}} toneladas, pureza {{purezaPorcentaje}}%, con documentacion aprobada por Nexus-SDR-ForensicGuard bajo folio interno {{loteId}}.

EL COMPRADOR: identificado como "{{compradorIdCodificado}}", con Prueba de Fondos en estatus: {{pofEstatus}}.

CLAUSULA 1 - OBJETO

El Comprador reserva en exclusiva el Lote {{loteId}} por 72 horas a partir de {{fechaReserva}}, comprometiendose a depositar en la cuenta de garantia (escrow) de Nexus Node el Monto Ofertado y Aceptado de $ {{montoOfertadoUsd}} USD antes de {{fechaExpiracion72h}}.

CLAUSULA 2 - REVELACION PROGRESIVA EN DOS ETAPAS

2.1. A la firma de este acuerdo, ninguna de las partes recibe razon social, ubicacion exacta ni contacto directo de la contraparte.

2.2. La identidad completa se revela UNICAMENTE despues de que Nexus Node confirme el deposito integro senalado en la Clausula 1, mediante el Contrato de Compraventa Final (Etapa 2).

2.3. Si el deposito no se completa dentro de las 72 horas, la reserva expira, ninguna identidad es revelada, y el Lote {{loteId}} regresa a disponibilidad para el siguiente comprador en la cola del Matchmaker.

CLAUSULA 3 - NO CIRCUNVENCION Y NO REVELACION

Ambas partes se obligan, por {{periodoProteccionMeses}} meses contados a partir de la revelacion de identidad (Etapa 2), a no transaccionar el Lote {{loteId}} ni lotes subsecuentes originados por la contraparte fuera de Nexus Node.

CLAUSULA 4 - PENALIZACION POR INCUMPLIMIENTO

La parte infractora paga {{porcentajePenalizacionTotal}}% del valor de la transaccion evadida, dividido entre Vendedor y Comprador ({{porcentajeVendedor}}% / {{porcentajeComprador}}%), mas interes moratorio de {{interesMoratorioMensual}}% mensual desde el dia {{diaInicioInteres}} de la notificacion de incumplimiento.

CLAUSULA 5 - COMISION DE PLATAFORMA

Nexus Node retiene entre {{comisionMinimaPct}}% y {{comisionMaximaPct}}% sobre el precio piso del Vendedor, mas el margen de arbitraje aplicable, calculado por el Deal Maker de forma deterministica.

Generado automaticamente el {{fechaGeneracion}} por el sistema de Nexus Node.`;

export const FINAL_TEMPLATE = `CONTRATO DE COMPRAVENTA FINAL - LOTE {{loteId}}
(Etapa 2 de Revelacion Progresiva - emitido solo tras confirmar deposito en escrow)

DATOS DEL LOTE

ID de Lote: {{loteId}}
Mineral: {{mineral}}
Toneladas: {{toneladas}} Tons
Pureza: {{purezaPorcentaje}}%
Puerto de Origen: {{puertoOrigen}}
Pais: {{pais}}

PARTES (IDENTIDAD REVELADA)

Vendedor: {{vendedorNombreEmpresa}}
Comprador: {{compradorEmail}}

TERMINOS COMERCIALES

Precio Publicado: $ {{precioPublicadoUsd}} USD
Monto Ofertado y Aceptado: $ {{montoOfertadoUsd}} USD

Este contrato reemplaza el acuerdo de identidades codificadas (Etapa 1) y confirma que ambas partes ya cumplieron NCNDA, verificacion forense (ForensicGuard) y deposito en escrow. A partir de este momento rige la proteccion de no circunvencion de {{periodoProteccionMeses}} meses definida en el NCNDA firmado en la Etapa 1.

Generado automaticamente el {{fechaGeneracion}} por el sistema de Nexus Node.`;

/**
 * Reemplaza cada {{variable}} en la plantilla por su valor real. Si una
 * variable no se proporciono, deja [[nombre]] visible en vez de dejarlo en
 * blanco -- asi un dato faltante se nota de inmediato en el PDF en vez de
 * desaparecer silenciosamente.
 */
export function renderizarPlantilla(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const valor = variables[key];
    return valor === undefined || valor === null ? `[[${key}]]` : String(valor);
  });
}
