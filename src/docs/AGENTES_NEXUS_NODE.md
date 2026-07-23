# Nexus Node OS — Arquitectura de los 8 Agentes (v2, corregida)

Este documento parte del diseño que compartió Rodrigo, con las correcciones acordadas y una
segunda sección de mejoras propuestas por Claude (Co-Founder AI) para maximizar automatización,
defensibilidad y revenue. Corresponde al código ya desplegado en `src/lib/agentes_prompts.ts` y
`src/services/agents/*.ts`.

---

## Correcciones aplicadas al diseño original

1. **Fusión del filtro antifraude.** El diseño original le daba la verificación documental tanto
   al SDR Inbound como a Legal & Compliance — la misma función, dos veces. Ahora es responsabilidad
   única de **Nexus-SDR-ForensicGuard** (Agente 2), y cubre tanto el documento del lote del minero
   como la Prueba de Fondos del comprador. Legal & Compliance (Agente 6) deja de analizar documentos
   y solo emite/verifica contratos y firmas, después de que ForensicGuard ya aprobó.
2. **Eliminación de la negociación humano-a-humano.** Comprador y vendedor nunca hablan entre sí ni
   con Nexus. El Deal Maker (Agente 5) no es un negociador conversacional: es una fórmula fija.
3. **Comisión corregida a 1.25%–3%** en todo el código (antes había una referencia a 5% en
   `agentes_prompts.ts`, contradecía `rules.ts` y el Master Plan).
4. **Riesgo legal señalado en el Hunter (Agente 1):** pedir la firma de exclusividad 72h en el mismo
   clic que el primer contacto frío es impugnable. Se agrega un paso de confirmación de interés antes
   de la firma.

---

## Los 8 Agentes

### 1. Hunter (Outbound Prospector)
**Misión:** alimentar constantemente la base de datos con compradores y vendedores precalificados de
todos los tamaños, para maximizar liquidez.
**Flujo:** monitorea fuentes públicas → valida calidad inicial del dato → registra en `leads` →
si detecta un vendedor con inventario probable, envía correo personalizado con el lote/oportunidad
detectada y un link a la landing de onboarding (carga de lote + documentación).
**Nota legal:** confirmación de interés antes de la firma de exclusividad 72h (no en el mismo clic).

### 2. Nexus-SDR-ForensicGuard (antifraude, único dueño de esta función)
**Misión:** cero fraudes, cero lotes fantasma. Cubre dos flujos con el mismo motor de scoring 0-100:
documentación del lote del minero, y Prueba de Fondos del comprador.
**Umbrales:** 95-100 APPROVED · 70-94 MANUAL_HOLD · 0-69 REJECTED_FRAUD_RISK.
**Spec completa:** `src/docs/prompts/1.1-sdr-antifraude.md`.

### 3. Matchmaker
**Misión:** encontrar la combinación óptima comprador-vendedor por búsqueda relacional/vectorial y
score de compatibilidad. Si el comprador top no cierra dentro de las 72h, reasigna automáticamente al
siguiente en score (cascada de re-matcheo, ya mapeada en `1.12-flujo-excepciones-supervisor.md`).

### 4. Outreach
**Misión:** notificar a ambas partes en paralelo en cuanto hay match, sin fase de "conversación" —
lleva directo a firmar NCNDA + exclusividad 72h. Es lógica determinística (plantillas +
disparadores), no requiere LLM.

### 5. Deal Maker (pricing determinístico, no negociador)
**Regla fija**, implementada como función de Postgres (`fn_calcular_pricing_deal_maker`, ya
desplegada en Supabase):

```
precio_piso        = precio que fijó el minero (nunca se reduce)
precio_publicado    = MIN(precio_piso + margen_nexus, precio_LME_del_lote − colchón_de_atractivo)
comision_nexus      = (precio_publicado − precio_piso) + comisión_base(1.25%–3%) sobre precio_piso
```

### 6. Legal & Compliance
**Misión:** emitir NCNDA y contrato de exclusividad/no-circunvención (24 meses, penalización 15%
dividida 7.5%/7.5%, interés moratorio 2% mensual desde el día 11), verificar firmas de ambas partes,
y confirmar documentación completa antes de liberar escrow. Ya no analiza fraude documental.

### 7. Financiero & Facturación (Billing & Escrow)
**Misión:** calcular la comisión final, generar el enlace/orden de pago a escrow, confirmar
recepción del depósito, emitir comprobante/factura automáticamente.

### 8. Supervisor (Orquestador)
**Misión:** monitorear `agent_activity_logs`, detectar tareas atascadas (>10 min), reintentar o
escalar a MANUAL_HOLD, liberar reservas expiradas (>72h), disparar re-matcheo, y correr seguimiento
post-venta a 7 días. Spec completa: `src/docs/prompts/1.14-prompt-agente-supervisor.md`.

---

## Mejoras propuestas por Claude (no estaban en el diseño original)

Estas son adiciones concretas orientadas a más revenue, más defensibilidad, o menos intervención
humana. Ninguna está implementada todavía — quedan como candidatas para agregar al plan de 30 días
o al roadmap del Mes 2 si Rodrigo y Federico las aprueban.

**Hunter**
- Priorizar leads por *tamaño de deal estimado × probabilidad de cierre*, no solo por orden de
  llegada — concentra el esfuerzo de outreach donde más rinde.
- Secuencia de re-contacto automática (día 3, 7, 14) para leads que no respondieron al primer
  correo, en vez de abandonarlos.

**SDR-ForensicGuard**
- Salida de "tier de calidad" (Platino/Oro/Plata) además de aprobado/rechazado, para dar acceso
  prioritario a compradores Tier-1 en lotes Platino — abre la puerta a cobrar una cuota de acceso
  prioritario como fuente de revenue adicional.
- Re-verificación automática antes de que un certificado cumpla 90 días (la propia regla de
  vigencia ya definida), para no mostrar un score "verificado" con datos caducados.

**Matchmaker**
- Si el mejor match no cierra, sugerir 2-3 alternativas en vez de solo la siguiente en score —
  mejora la tasa de recuperación de la cascada de re-matcheo.
- Modelo simple de predicción de demanda repetida por comprador, para que el Hunter salga a buscar
  inventario *antes* de que la demanda aparezca (inventario adelantado a la demanda — un foso real
  frente a brokers que solo reaccionan).

**Deal Maker**
- Colchón de atractivo (`buffer_pct`) dinámico según cuántos lotes verificados del mismo commodity
  están activos simultáneamente (más competencia → mayor descuento necesario; poca oferta → se
  puede capturar más margen).
- Alerta automática cuando el piso del minero ya está por encima del LME (sin espacio de arbitraje)
  para que el equipo pueda asesorar al vendedor en vej de dejar el lote estancado en silencio.

**Legal & Compliance**
- Plantillas de NCNDA/no-circunvención adaptadas por jurisdicción (México, Chile, Perú tienen
  normas de exigibilidad distintas) en vez de una plantilla genérica — protege que la comisión
  realmente se pueda cobrar en corte si alguien intenta saltarse a Nexus.

**Financiero & Escrow**
- Reconciliación automática: comparar el monto liberado en cada escrow contra la comisión que
  calculó el Deal Maker, para detectar fugas de revenue (redondeos, overrides manuales) antes de
que se acumulen.
- Incentivo por pago anticipado (ej. 0.25% de descuento si el comprador deposita en <24h en vez de
  esperar las 72h) — acelera el ciclo de caja y reduce la ventana de riesgo de que el trato se caiga.

**Supervisor**
- Reporte semanal automático a fundadores: ticket promedio, take rate real de Nexus (comisión +
  spread de arbitraje), tiempo de ciclo match→escrow, tasa de aprobación de lotes — convierte al
  Supervisor en soporte de decisión, no solo en monitoreo técnico.
- Alerta de anomalía si el margen capturado en un trato específico es inusualmente bajo o negativo
 — protege contra que el bug de comisión (5% vs 1.25-3%) o algo similar se vuelva a colar.
