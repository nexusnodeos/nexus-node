// src/services/agents/config/rules.ts

export const NEXUS_NODE_LEGAL_RULES = {
    /**
     * Periodo de protección estricta de No Circunvención (NCNDA) bilateral.
     * Prohíbe que el minero y comprador específicos hagan transacciones directas por fuera.
     */
    PERIODO_PROTECCION_MESES: 24,
  
    /**
     * Porcentaje de penalización total sobre el valor de la venta detectada por fuera.
     * Se divide en partes iguales entre ambas entidades infractoras.
     */
    PORCENTAJE_PENALIZACION_PUENTEO: 0.15, // 15% total
    PORCENTAJE_MINERO: 0.075,              // 7.5%
    PORCENTAJE_COMPRADOR: 0.075,           // 7.5%
  
    /**
     * Interés moratorio mensual acumulativo aplicado a partir del día 11 de la notificación.
     */
    INTERES_MORATORIO_MENSUAL: 0.02, // 2% mensual
  
    /**
     * Rango de comisiones garantizadas por volumen de plataforma sobre cualquier lote.
     */
    COMISION_PLATAFORMA_MINIMA: 0.0125, // 1.25%
    COMISION_PLATAFORMA_MAXIMA: 0.0300, // 3.00%
  };
  
  export const PROTOCOLO_DATOS_LOTE = {
    DOCUMENTOS_REQUERIDOS: [
      "Certificado Químico de Ensayo (SGS / Alex Stewart)",
      "Guía de Despacho / Manifiesto de Carga Interno",
      "Certificado de Origen y Trazabilidad Legal"
    ],
    PUREZA_MINIMA_ACEPTABLE: 90.0, // Grado A o similar refinado
  };