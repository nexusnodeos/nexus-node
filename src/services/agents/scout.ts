import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const CORREO_DE_PRUEBA = 'nexusnode.os@gmail.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY as string);

// Calendario de seguimiento: dia 3, dia 7, dia 14 tras el primer contacto.
// intentos_contacto ya hecho -> dias hasta el SIGUIENTE intento.
const CALENDARIO_SEGUIMIENTO_DIAS: Record<number, number> = {
  1: 3, // tras el 1er contacto, el 2o toque es en +3 dias (dia 3)
  2: 4, // tras el 2o contacto (dia 3), el 3er toque es en +4 dias (dia 7)
  3: 7, // tras el 3er contacto (dia 7), el 4o toque es en +7 dias (dia 14)
};
const MAX_INTENTOS_CONTACTO = 4;

export const scoutEmailTemplates = {
  formalLiquidez: (contactName: string, company: string) => ({
    subject: `Oportunidad de colocación inmediata para ${company} / Nexus Node`,
    body: `Estimado/a ${contactName},

Hemos estado siguiendo de cerca la actividad comercial de ${company} y nos ponemos en contacto con usted directamente desde Nexus Node.

Actualmente operamos como un marketplace tecnológico de alta liquidez para el comercio de cobre. Contamos con una red de compradores internacionales pre-calificados.

Si tiene disponibilidad de stock, le invito a revisar nuestra estructura operativa.

Atentamente,
Agente Outbound Scout
Nexus Node Operations`,
  }),
  cortoMercado: (contactName: string, company: string) => ({
    subject: `Compra de Cobre para ${company} - Nexus Node`,
    body: `Hola, ${contactName}.

Le escribo porque en Nexus Node tenemos órdenes de compra activas para concentrado de cobre, indexadas a la LME, que podrían interesarle a ${company}.

Nuestro ecosistema elimina los retrasos de los brókers tradicionales. ¿Cuentan con algún lote listo para comercialización?

Saludos cordiales,
Agente Outbound Scout
Nexus Node Operations`,
  }),
  seguimiento: (
    diaNumero: number,
    contactName: string,
    company: string,
    leadType: 'vendedor' | 'comprador'
  ) => ({
    subject: `[Seguimiento día ${diaNumero}] ${leadType === 'vendedor' ? 'Colocación de inventario' : 'Compra de cobre'} — ${company}`,
    body: `Hola ${contactName},

Le escribí hace unos días sobre ${
      leadType === 'vendedor'
        ? 'la posibilidad de colocar el inventario de cobre de ' + company + ' a través de Nexus Node'
        : 'las órdenes de compra de cobre activas que tenemos disponibles para ' + company
    }, y quería darle seguimiento por si se le pasó el primer correo.

Seguimos con disponibilidad ${leadType === 'vendedor' ? 'de compradores calificados' : 'de lotes verificados'} y con la misma estructura de alta liquidez. Si le interesa avanzar, con gusto le comparto los siguientes pasos.

Saludos,
Agente Outbound Scout
Nexus Node Operations`,
  }),
};

interface LeadPriorizable {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  lead_type: 'vendedor' | 'comprador';
  status: string;
  valor_estimado_usd: number;
  probabilidad_cierre: number;
  intentos_contacto: number;
}

function calcularPrioridad(lead: LeadPriorizable): number {
  return Number(lead.valor_estimado_usd) * (Number(lead.probabilidad_cierre) / 100);
}

async function enviarCorreoSimulado(params: {
  destinatarioReal: string;
  destinatarioSimulado: string;
  subject: string;
  body: string;
}) {
  return resend.emails.send({
    from: 'Nexus Node Scout <onboarding@resend.dev>',
    to: params.destinatarioReal,
    subject: `[SIMULACIÓN para ${params.destinatarioSimulado}] - ${params.subject}`,
    html: `
      <div style="background: #FFF3CD; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
        <strong>⚠️ AVISO DE MODO PILOTO:</strong> Este correo es una simulación generada por el Agente Scout.
        En producción, se habría enviado a: <strong>${params.destinatarioSimulado}</strong>.
      </div>
      <div style="white-space: pre-wrap; font-family: sans-serif;">
        ${params.body}
      </div>
    `,
  });
}

/**
 * Contacto inicial: toma los leads nuevos, los prioriza por
 * (valor_estimado_usd x probabilidad_cierre) de mayor a menor, y les manda
 * el primer correo. Programa el primer seguimiento automático a +3 dias.
 */
export async function correrContactoInicialScout() {
  console.log('🤖 Iniciando Agente Scout — Contacto Inicial...');

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'nuevo');

  if (error) {
    return console.error('❌ Error al leer leads nuevos:', error);
  }
  if (!leads || leads.length === 0) {
    console.log('📊 No hay leads nuevos que contactar.');
    return;
  }

  const leadsPriorizados = [...leads].sort(
    (a, b) => calcularPrioridad(b) - calcularPrioridad(a)
  );

  console.log(`📊 ${leadsPriorizados.length} leads nuevos, priorizados por valor estimado x probabilidad de cierre.`);

  for (const lead of leadsPriorizados) {
    const template =
      lead.lead_type === 'vendedor'
        ? scoutEmailTemplates.formalLiquidez(lead.contact_name, lead.company_name)
        : scoutEmailTemplates.cortoMercado(lead.contact_name, lead.company_name);

    try {
      const data = await enviarCorreoSimulado({
        destinatarioReal: CORREO_DE_PRUEBA,
        destinatarioSimulado: `${lead.contact_name} (${lead.email})`,
        subject: template.subject,
        body: template.body,
      });
      console.log(
        `✅ [Prioridad $${calcularPrioridad(lead).toLocaleString()}] Correo inicial enviado a ${lead.company_name}. ID: ${data.data?.id}`
      );

      await supabase
        .from('leads')
        .update({
          status: 'contactado_piloto',
          intentos_contacto: 1,
          ultimo_contacto_en: new Date().toISOString(),
          proximo_seguimiento_en: new Date(
            Date.now() + CALENDARIO_SEGUIMIENTO_DIAS[1] * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', lead.id);
    } catch (err) {
      console.error(`❌ Error enviando correo inicial a ${lead.company_name}:`, err);
    }
  }
}

/**
 * Secuencia de re-contacto: busca leads ya contactados cuyo
 * proximo_seguimiento_en ya se cumplió, y les manda el siguiente
 * correo de seguimiento (dia 3, 7 o 14). Tras el 4o intento sin
 * respuesta, los marca como sin_respuesta_piloto y deja de insistir.
 */
export async function correrSeguimientoScout() {
  console.log('🤖 Iniciando Agente Scout — Secuencia de Re-contacto...');

  const ahora = new Date().toISOString();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'contactado_piloto')
    .lt('intentos_contacto', MAX_INTENTOS_CONTACTO)
    .lte('proximo_seguimiento_en', ahora);

  if (error) {
    return console.error('❌ Error al leer leads para seguimiento:', error);
  }
  if (!leads || leads.length === 0) {
    console.log('📊 No hay seguimientos pendientes por ahora.');
    return;
  }

  const leadsPriorizados = [...leads].sort(
    (a, b) => calcularPrioridad(b) - calcularPrioridad(a)
  );

  console.log(`📊 ${leadsPriorizados.length} leads con seguimiento vencido.`);

  for (const lead of leadsPriorizados) {
    const intentoActual = lead.intentos_contacto as number;
    const diaEtiqueta = intentoActual === 1 ? 3 : intentoActual === 2 ? 7 : 14;

    const template = scoutEmailTemplates.seguimiento(
      diaEtiqueta,
      lead.contact_name,
      lead.company_name,
      lead.lead_type
    );

    try {
      const data = await enviarCorreoSimulado({
        destinatarioReal: CORREO_DE_PRUEBA,
        destinatarioSimulado: `${lead.contact_name} (${lead.email})`,
        subject: template.subject,
        body: template.body,
      });
      console.log(`✅ Seguimiento día ${diaEtiqueta} enviado a ${lead.company_name}. ID: ${data.data?.id}`);

      const nuevoIntento = intentoActual + 1;

      await supabase
        .from('leads')
        .update({
          intentos_contacto: nuevoIntento,
          ultimo_contacto_en: new Date().toISOString(),
          status: nuevoIntento >= MAX_INTENTOS_CONTACTO ? 'sin_respuesta_piloto' : 'contactado_piloto',
          proximo_seguimiento_en:
            nuevoIntento >= MAX_INTENTOS_CONTACTO
              ? null
              : new Date(
                  Date.now() + CALENDARIO_SEGUIMIENTO_DIAS[nuevoIntento] * 24 * 60 * 60 * 1000
                ).toISOString(),
        })
        .eq('id', lead.id);
    } catch (err) {
      console.error(`❌ Error enviando seguimiento a ${lead.company_name}:`, err);
    }
  }
}

// Al correr este archivo directamente (ej. durante los dias de simulacion),
// primero contacta leads nuevos y despues procesa los seguimientos vencidos.
async function main() {
  await correrContactoInicialScout();
  await correrSeguimientoScout();
}

main();
