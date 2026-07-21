import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const CORREO_DE_PRUEBA = 'nexusnode.os@gmail.com'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const scoutEmailTemplates = {
  formalLiquidez: (contactName: string, company: string) => ({
    subject: `Oportunidad de colocación inmediata para ${company} / Nexus Node`,
    body: `Estimado/a ${contactName},\n\nHemos estado siguiendo de cerca la actividad comercial de ${company} y nos ponemos en contacto con usted directamente desde Nexus Node. \n\nActualmente operamos como un marketplace tecnológico de alta liquidez para el comercio de cobre. Contamos con una red de compradores internacionales pre-calificados.\n\nSi tiene disponibilidad de stock, le invito a revisar nuestra estructura operativa.\n\nAtentamente,\nAgente Outbound Scout\nNexus Node Operations`
  }),
  cortoMercado: (contactName: string, company: string) => ({
    subject: `Compra de Cobre para ${company} - Nexus Node`,
    body: `Hola, ${contactName}.\n\nLe escribo porque en Nexus Node tenemos órdenes de compra activas para concentrado de cobre, indexadas a la LME, que podrían interesarle a ${company}.\n\nNuestro ecosistema elimina los retrasos de los brókers tradicionales. ¿Cuentan con algún lote listo para comercialización?\n\nSaludos cordiales,\nAgente Outbound Scout\nNexus Node Operations`
  })
};

export async function correrPruebaPilotoScout() {
  console.log("🤖 Iniciando Agente Scout...");

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'nuevo');

  if (error || !leads || leads.length === 0) {
    return console.error("❌ Error o no hay leads:", error);
  }

  console.log(`📊 Se encontraron ${leads.length} leads nuevos.`);

  for (const lead of leads) {
    let template = lead.lead_type === 'vendedor' 
      ? scoutEmailTemplates.formalLiquidez(lead.contact_name, lead.company_name)
      : scoutEmailTemplates.cortoMercado(lead.contact_name, lead.company_name);

    try {
      const data = await resend.emails.send({
        from: 'Nexus Node Scout <onboarding@resend.dev>',
        to: CORREO_DE_PRUEBA,
        subject: `[SIMULACIÓN para ${lead.email}] - ${template.subject}`,
        html: `
          <div style="background: #FFF3CD; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            <strong>⚠️ AVISO DE MODO PILOTO:</strong> Este correo es una simulación generada por el Agente Scout. 
            En producción, se habría enviado a: <strong>${lead.contact_name} (${lead.email})</strong>.
          </div>
          <div style="white-space: pre-wrap; font-family: sans-serif;">
            ${template.body}
          </div>
        `
      });

      console.log(`✅ Correo enviado vía Resend. ID: ${data.data?.id}`);
      
      // Actualizamos Supabase
      await supabase.from('leads').update({ status: 'contactado_piloto' }).eq('id', lead.id);

    } catch (err) {
      console.error(`❌ Error enviando correo a ${lead.company_name}:`, err);
    }
  }
}


// Agrega esto al final de tu archivo scout.ts
correrPruebaPilotoScout();
