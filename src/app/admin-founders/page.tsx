"use client";

import React, { useState } from "react";
import { 
  Calendar, CheckCircle2, Circle, User, ShieldCheck, 
  TrendingUp, ArrowRight, BarChart3, ChevronRight, Award,
  Sparkles, Copy, Clock, Filter, Check, Rocket, Target, Zap
} from "lucide-react";

interface Task {
  id: string;
  phase_number: number;
  week_number: number;
  day_name: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  step_order: number;
  title: string;
  description: string;
  step_by_step: string;
  ideal_perfection_goal: string;
  impact_purpose: string;
  assignee: string;
  status: "Pendiente" | "En Progreso" | "Completado";
  ai_rescue_prompt: string;
}

export default function UnicornFoundersDashboard() {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>("Lunes");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("TODOS");
  const [activePromptModal, setActivePromptModal] = useState<Task | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Estado local de subtareas (Puebla la Semana 1 con las 40 tareas)
  const [tasks, setTasks] = useState<Task[]>([
    // DÍA 1 (LUNES) - 8 TAREAS
    { id: "t1", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 1, title: "Diseño del Esquema SQL Relacional", description: "Tablas relacionales para usuarios, lotes y custodia.", step_by_step: "1) Abrir SQL Editor. 2) Crear tablas profiles, mineral_lots, trade_orders. 3) Configurar FKs.", ideal_perfection_goal: "Cero redundancia y precisión decimal exacta en USD.", impact_purpose: "Garantiza solidez técnica para transacciones de $100k+ USD.", assignee: "Rodrigo (CEO & Tech)", status: "Completado", ai_rescue_prompt: "Actúa como Principal Database Architect. Genera el script SQL para Supabase con tablas: profiles, mineral_lots, trade_orders, escrow_accounts y audit_logs." },
    { id: "t2", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 2, title: "Configuración de RLS & Seguridad Multi-Tenant", description: "Políticas de aislamiento de datos por usuario.", step_by_step: "1) Activar RLS. 2) Crear políticas por auth.uid(). 3) Auditar permisos.", ideal_perfection_goal: "Seguridad bancaria por fila; ningún minero ve a su competencia.", impact_purpose: "Cumple con compliance corporativo B2B.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Actúa como Cybersecurity Lead. Genera políticas RLS para Supabase aislando mineros y compradores." },
    { id: "t3", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 3, title: "Client & Middleware Supabase en Next.js", description: "Conexión SSR segura con Next.js App Router.", step_by_step: "1) Instalar @supabase/ssr. 2) Configurar middleware.ts. 3) Probar tokens.", ideal_perfection_goal: "Sesiones de servidor limpias sin flickering.", impact_purpose: "Protección total de rutas en el dashboard de fundadores.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Actúa como Next.js Architect. Crea los helper files para Supabase SSR en Next.js." },
    { id: "t4", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 4, title: "Audit Trail System para Finanzas", description: "Logs forenses de cambios de estado en transacciones.", step_by_step: "1) Tabla audit_logs. 2) Trigger PL/pgSQL en trade_orders. 3) Test inserción.", ideal_perfection_goal: "Trazabilidad del 100% en liberación de fondos.", impact_purpose: "Aporta respaldo auditable para bancos custodios.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe la función PL/pgSQL y Trigger en Supabase para audit_logs en trade_orders." },
    
    { id: "t5", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 5, title: "Matriz de Cliente Ideal (ICP Minero)", description: "Filtros para mineras medianas de Cobre/Oro.", step_by_step: "1) Rango 100-1,000 Ton/mes. 2) Decisores C-Level. 3) Urgencia de liquidez.", ideal_perfection_goal: "Documento ICP 100% acotado a mineras con dolor inmediato.", impact_purpose: "Evita perder meses en prospectos calificados erróneamente.", assignee: "Federico (COO)", status: "Completado", ai_rescue_prompt: "Actúa como B2B Strategy Lead. Elabora el documento ICP para mineras de Cobre y Oro en LATAM." },
    { id: "t6", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 6, title: "Mapeo de Catastros Mineros Oficiales", description: "Extracción de registros gubernamentales del SGM y ANM.", step_by_step: "1) Entrar a SGM (MX) y ANM (CO). 2) Filtrar títulos vigentes. 3) Guardar dataset.", ideal_perfection_goal: "100 concesiones mineras legales verificadas.", impact_purpose: "Garantiza legitimidad comercial desde el origen.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Mapea el proceso de extracción de datos del catastro minero de México y Colombia." },
    { id: "t7", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 7, title: "Guión de Presentación Corta (1-Pager)", description: "Copy ejecutivo para prospección B2B.", step_by_step: "1) Resumir cobro en 48h. 2) Beneficios de custodia. 3) Call to Action.", ideal_perfection_goal: "Teaser de 1 página directo y convincente.", impact_purpose: "Dispara la tasa de respuesta en frío.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Redacta un Teaser Ejecutivo de 1 página para VPs de Operaciones Mineras." },
    { id: "t8", phase_number: 1, week_number: 1, day_name: "Lunes", step_order: 8, title: "Setup Pipeline Comercial CRM", description: "Configuración del embudo de ventas para custodia.", step_by_step: "1) Crear etapas del pipeline. 2) Configurar campos de tonelaje. 3) Test de flujo.", ideal_perfection_goal: "Embudo CRM sin fricciones listo para 50 leads.", impact_purpose: "Visibilidad total del estado comercial de la empresa.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Configura el pipeline B2B en CRM para transacciones de intermediación de minerales." },

    // MARTES (8 TAREAS)
    { id: "t9", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 1, title: "API Route CSV Lead Import", description: "Endpoint Next.js para carga masiva de leads.", step_by_step: "1) Route handler. 2) Parse CSV multipart. 3) Upsert en Supabase.", ideal_perfection_goal: "Importación de 100 leads en menos de 3 segundos.", impact_purpose: "Automatiza la ingesta de prospectos sin trabajo manual.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe la API Route de Next.js para procesar e importar un CSV de leads B2B en Supabase." },
    { id: "t10", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 2, title: "Índices SQL & Speed Optimization", description: "Optimización de consultas sobre la BD de prospectos.", step_by_step: "1) Índices B-Tree en email, country. 2) Benchmark de queries.", ideal_perfection_goal: "Consultas de leads en menos de 15ms.", impact_purpose: "Mantiene la velocidad del dashboard sin importar volumen.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Genera el script SQL para índices optimizados en las tablas profiles y mineral_lots." },
    { id: "t11", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 3, title: "Componente React Admin Lead Management", description: "Tabla con filtros avanzados para el equipo comercial.", step_by_step: "1) UI React Tailwind. 2) Filtros por país/mineral. 3) Botones de acción.", ideal_perfection_goal: "Interfaz estilo Bloomberg Terminal ultra intuitiva.", impact_purpose: "Permite al COO auditar la calidad del pipeline en vivo.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Crea el componente React Tailwind para la gestión y filtrado de leads B2B." },
    { id: "t12", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 4, title: "Webhook Trigger de Enriquecimiento", description: "Disparador automático al insertar un nuevo lead.", step_by_step: "1) Webhook en Supabase. 2) Endpoint receptor. 3) Logs de eventos.", ideal_perfection_goal: "Automatización en background lista para Apollo/Hunter.", impact_purpose: "Elimina pasos manuales en el pipeline de datos.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe la API Route handler para recibir webhooks de creación de leads en Supabase." },

    { id: "t13", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 5, title: "Scraping de 100 Titulares Mineros", description: "Extracción masiva de bases públicas gubernamentales.", step_by_step: "1) Búsqueda en catastros oficiales. 2) Extracción de razones sociales. 3) Guardar datos.", ideal_perfection_goal: "Dataset de 100 empresas con producción real.", impact_purpose: "Base primaria verificada para prospección comercial.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Instruye el scraping/extracción de 100 titulares mineros activos de Cobre y Oro en LATAM." },
    { id: "t14", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 6, title: "Enriquecimiento C-Level en Sales Nav", description: "Obtención de correos directos y móviles de VPs.", step_by_step: "1) Búsqueda en Sales Navigator. 2) Extracción con Apollo. 3) Enriquecimiento.", ideal_perfection_goal: "50 decisores con email corporativo directo.", impact_purpose: "Llega directo al decisor sin intermediarios.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Define el flujo para enriquecer contactos de directores de operaciones mineras." },
    { id: "t15", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 7, title: "Limpieza de Correos en NeverBounce", description: "Validación de entregabilidad y reducción de rebotes.", step_by_step: "1) Cargar lista en NeverBounce. 2) Filtrar válidos. 3) Limpiar dataset.", ideal_perfection_goal: "Tasa de rebote estimada por debajo del 1%.", impact_purpose: "Protege el dominio corporativo contra bloqueos.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Establece el protocolo de verificación de correos B2B para mantener la reputación del dominio." },
    { id: "t16", phase_number: 1, week_number: 1, day_name: "Martes", step_order: 8, title: "Priorización por Capacidad de Tonelaje", description: "Clasificación de prospectos en Tier 1 y Tier 2.", step_by_step: "1) Estimar producción mensual. 2) Ordenar por volumen. 3) Marcar prioridad.", ideal_perfection_goal: "Matriz comercial priorizada para máximo GMV.", impact_purpose: "Enfoca esfuerzo en las oportunidades de mayor valor.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Crea una matriz de priorización para leads mineros basada en volumen de producción." },

    // MIÉRCOLES (8 TAREAS)
    { id: "t17", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 1, title: "Autenticación DNS (SPF, DKIM, DMARC)", description: "Configuración de seguridad del dominio de correo.", step_by_step: "1) Configurar registros en DNS. 2) Validar firmas DKIM. 3) Probar política DMARC.", ideal_perfection_goal: "Calificación 100/100 en entregabilidad de correo.", impact_purpose: "Garantiza llegada a bandeja de entrada principal.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Genera los registros DNS exactos para SPF, DKIM y DMARC en Vercel y Resend." },
    { id: "t18", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 2, title: "SDK Resend API en TypeScript", description: "Módulo programático para envíos de correo.", step_by_step: "1) Instalar SDK de Resend. 2) Configurar cliente con API Key. 3) Probar envíos.", ideal_perfection_goal: "Módulo de envío con reintentos automáticos.", impact_purpose: "Permite automatizar comunicaciones masivas.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe el módulo de servicio de email en TypeScript utilizando el SDK de Resend." },
    { id: "t19", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 3, title: "Plantilla React Email Responsive", description: "Diseño visual para la propuesta comercial.", step_by_step: "1) Crear plantilla en React Email. 2) Inyectar variables dinámicas. 3) Validar diseño.", ideal_perfection_goal: "Plantilla limpia y profesional adaptable a móviles.", impact_purpose: "Proyecta solidez institucional ante los prospectos.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Diseña una plantilla con React Email para propuesta B2B de custodia comercial." },
    { id: "t20", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 4, title: "Endpoint Webhook de Métricas (`/api/webhooks/resend`)", description: "Captura de aperturas y clics en tiempo real.", step_by_step: "1) Crear API Route en Next.js. 2) Validar firma. 3) Actualizar estados en Supabase.", ideal_perfection_goal: "Registro inmediato de interacciones en la base de datos.", impact_purpose: "Identifica prospectos interesados al instante.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Diseña la API Route para recibir eventos de webhook de Resend (aperturas y clics)." },

    { id: "t21", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 5, title: "Copy Email Outbound #1 (Cobro en 48h)", description: "Redacción del primer mensaje frío.", step_by_step: "1) Definir asunto de alto impacto. 2) Redactar propuesta en 80 palabras. 3) Incluir CTA.", ideal_perfection_goal: "Mensaje directo con tasa estimada de apertura mayor al 45%.", impact_purpose: "Genera interés en directivos con necesidad de liquidez.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Redacta el primer correo frío B2B destacando la solución de cobro en 48 horas." },
    { id: "t22", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 6, title: "Copy Email Outbound #2 (Caso SGS)", description: "Redacción del correo de seguimiento.", step_by_step: "1) Explicar el proceso de custodia. 2) Resaltar la verificación SGS. 3) Incluir invitación.", ideal_perfection_goal: "Secuencia que incrementa la tasa de respuesta total.", impact_purpose: "Aclara dudas operativas comunes antes de la llamada.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Escribe el correo de seguimiento #2 explicando cómo la certificación SGS libera los fondos." },
    { id: "t23", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 7, title: "Manual de Respuestas a Objeciones", description: "Guía para resolver dudas comerciales habituales.", step_by_step: "1) Mapear objeciones frecuentes. 2) Redactar argumentos claros para cada una.", ideal_perfection_goal: "Guía de respuesta rápida para el equipo comercial.", impact_purpose: "Asegura consistencia en los argumentos de venta.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Elabora un manual de respuestas a objeciones para la venta de servicios de custodia B2B." },
    { id: "t24", phase_number: 1, week_number: 1, day_name: "Miércoles", step_order: 8, title: "Configuración de Calendly & Agenda", description: "Sistema de agendamiento con recordatorios.", step_by_step: "1) Configurar evento de demostración. 2) Conectar Google Meet. 3) Activar recordatorios.", ideal_perfection_goal: "Agendamiento simple con recordatorios automáticos.", impact_purpose: "Facilita la coordinación de reuniones con prospectos.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Define los textos de confirmación y recordatorios automáticos para reuniones agendadas." },

    // JUEVES (8 TAREAS)
    { id: "t25", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 1, title: "Script de Envío Progresivo de Correos", description: "Lanzamiento programado de la campaña.", step_by_step: "1) Iniciar script de envío. 2) Controlar intervalos. 3) Monitorear entregas.", ideal_perfection_goal: "Envío del 100% de los correos dentro del rango planificado.", impact_purpose: "Inicia el contacto comercial con el mercado objetivo.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe un script en Node.js para enviar correos en lotes con pausas programadas." },
    { id: "t26", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 2, title: "Panel de Métricas de Campaña en Vivo", description: "Visualización en tiempo real de interacciones.", step_by_step: "1) Crear consultas en Supabase. 2) Renderizar indicadores en la interfaz.", ideal_perfection_goal: "Panel actualizado en tiempo real con la actividad de campaña.", impact_purpose: "Permite identificar oportunidades de seguimiento inmediato.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Crea una vista en Next.js con indicadores de correos enviados, lecturas y clics." },
    { id: "t27", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 3, title: "Algoritmo de Calificación de Interés", description: "Puntuación automática de prospectos según interacción.", step_by_step: "1) Definir reglas de puntos. 2) Actualizar la puntuación en la base de datos.", ideal_perfection_goal: "Clasificación automática de prospectos por nivel de interés.", impact_purpose: "Enfoca el seguimiento en los prospectos más calificados.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Diseña la lógica para calcular la puntuación de interés de los prospectos según sus clics y lecturas." },
    { id: "t28", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 4, title: "Sistema de Respaldos para Envíos", description: "Configuración de proveedor secundario de correo.", step_by_step: "1) Configurar cuenta de respaldo. 2) Dejar lista la alternativa de conmutación.", ideal_perfection_goal: "Infraestructura de envío redundante ante fallos.", impact_purpose: "Asegura la continuidad de las comunicaciones comerciales.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Diseña una estrategia para alternar entre proveedores de correo en caso de contingencia." },

    { id: "t29", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 5, title: "Monitoreo y Seguimiento Inmediato", description: "Identificación de prospectos interactuando con los correos.", step_by_step: "1) Revisar aperturas en tiempo real. 2) Seleccionar prospectos prioritarios.", ideal_perfection_goal: "Identificación de prospectos clave para contacto directo.", impact_purpose: "Aprovecha el interés inmediato del prospecto.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Define el procedimiento para contactar de inmediato a los prospectos con múltiples aperturas de correo." },
    { id: "t30", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 6, title: "Jornada de Llamadas a Prospectos Key", description: "Llamadas de seguimiento a directivos clave.", step_by_step: "1) Contactar prospectos prioritarios. 2) Usar guión corto. 3) Agendar reunión.", ideal_perfection_goal: "Agendar entre 2 y 4 reuniones de demostración.", impact_purpose: "Acelera el avance de las oportunidades comerciales.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Elabora el guión telefónico corto para agendar reuniones de demostración con directores mineros." },
    { id: "t31", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 7, title: "Contacto Profesional en LinkedIn", description: "Mensajes directos a ejecutivos seleccionados.", step_by_step: "1) Enviar solicitudes personalizadas. 2) Incluir propuesta de valor breve.", ideal_perfection_goal: "Incremento en los puntos de contacto con decisores.", impact_purpose: "Refuerza la presencia comercial por canales profesionales.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Escribe los mensajes de contacto en LinkedIn dirigidos a ejecutivos del sector minero." },
    { id: "t32", phase_number: 1, week_number: 1, day_name: "Jueves", step_order: 8, title: "Actualización Diaria del CRM", description: "Registro de avances e interacciones en el sistema.", step_by_step: "1) Registrar notas y estados. 2) Programar tareas de seguimiento.", ideal_perfection_goal: "Pipeline comercial actualizado y bien documentado.", impact_purpose: "Mantiene la organización del proceso de ventas.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Define la estructura de registro de interacciones comerciales en el CRM." },

    // VIERNES (8 TAREAS)
    { id: "t33", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 1, title: "Vista de Previsualización de Contrato", description: "Componente interactivo para revisar acuerdos.", step_by_step: "1) Diseñar la vista en Next.js. 2) Cargar datos dinámicos. 3) Habilitar opción PDF.", ideal_perfection_goal: "Previsualización profesional de los términos del acuerdo.", impact_purpose: "Facilita la revisión de condiciones comerciales con clientes.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Desarrolla el componente React para la previsualización del borrador del acuerdo de custodia." },
    { id: "t34", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 2, title: "Consultas de Indicadores Semanales", description: "Consolidación de métricas clave en la base de datos.", step_by_step: "1) Crear vista SQL de resumen. 2) Calcular porcentaje de avance y resultados.", ideal_perfection_goal: "Vista consolidada de indicadores de la semana.", impact_purpose: "Ofrece datos claros para evaluar el progreso del sprint.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Escribe la vista SQL para consolidar métricas de tareas completadas e interacciones comerciales." },
    { id: "t35", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 3, title: "Módulo de Informes de Cierre Semanal", description: "Generación automática del informe de avance.", step_by_step: "1) Crear API Route de informe. 2) Formatear datos de cierre. 3) Guardar en base de datos.", ideal_perfection_goal: "Informe de cierre consolidado en la plataforma.", impact_purpose: "Documenta formalmente los avances del proyecto.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Diseña la API Route para estructurar y guardar el informe de avance semanal." },
    { id: "t36", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 4, title: "Resguardo de Seguridad de Base de Datos", description: "Copia de seguridad semanal de la plataforma.", step_by_step: "1) Ejecutar respaldo en Supabase. 2) Validar integridad. 3) Registrar bitácora.", ideal_perfection_goal: "Resguardo completo y verificado de la información.", impact_purpose: "Asegura los datos recopilados durante la semana.", assignee: "Rodrigo (CEO & Tech)", status: "Pendiente", ai_rescue_prompt: "Establece la rutina de verificación de integridad y copia de seguridad para la base de datos." },

    { id: "t37", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 5, title: "Seguimiento Final de Agendamiento", description: "Confirmación de reuniones comerciales para la siguiente semana.", step_by_step: "1) Contactar prospectos en proceso. 2) Confirmar horarios. 3) Enviar invitaciones.", ideal_perfection_goal: "Asegurar al menos 5 reuniones comerciales agendadas.", impact_purpose: "Garantiza continuidad en el flujo de oportunidades comerciales.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Escribe el mensaje de confirmación final para asegurar la asistencia a las reuniones agendadas." },
    { id: "t38", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 6, title: "Borrador de Términos Comerciales (Term Sheet)", description: "Documento base para acuerdos piloto.", step_by_step: "1) Definir esquemas de comisiones. 2) Establecer tiempos de custodia. 3) Redactar condiciones.", ideal_perfection_goal: "Documento de términos comerciales listo para presentación.", impact_purpose: "Establece el marco de negociación para las pruebas piloto.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Elabora el documento de términos comerciales de 1 página para acuerdos piloto de custodia." },
    { id: "t39", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 7, title: "Preparación de Material para Demonstraciones", description: "Ajuste de la presentación para reuniones comerciales.", step_by_step: "1) Actualizar presentación. 2) Probar demostración en vivo. 3) Ensayar presentación.", ideal_perfection_goal: "Presentación comercial preparada y ensayada.", impact_purpose: "Aumenta la efectividad en las reuniones con prospectos.", assignee: "Federico (COO)", status: "Pendiente", ai_rescue_prompt: "Estructura la presentación comercial de 15 minutos para reuniones de demostración." },
    { id: "t40", phase_number: 1, week_number: 1, day_name: "Viernes", step_order: 8, title: "Evaluación Semanal de Fundadores", description: "Revisión de resultados y planificación del siguiente período.", step_by_step: "1) Revisar cumplimiento de tareas. 2) Evaluar indicadores comerciales. 3) Aprobar informe de cierre.", ideal_perfection_goal: "Evaluación completa del avance semanal y acuerdos claros.", impact_purpose: "Mantiene la alineación de objetivos entre ambos fundadores.", assignee: "Rodrigo & Federico (Conjunto)", status: "Pendiente", ai_rescue_prompt: "Redacta el formato de evaluación semanal para revisar avances técnicos, comerciales y prioridades." }
  ]);

  // Cambiar estado de una subtarea en tiempo real
  const updateTaskStatus = (id: string, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // Filtrado de Subtareas
  const filteredTasks = tasks.filter(t => {
    const matchPhase = t.phase_number === selectedPhase;
    const matchWeek = t.week_number === selectedWeek;
    const matchDay = selectedDay === "TODOS" || t.day_name === selectedDay;
    const matchAssignee = 
      assigneeFilter === "TODOS" ? true :
      assigneeFilter === "RODRIGO" ? t.assignee.includes("Rodrigo") :
      assigneeFilter === "FEDERICO" ? t.assignee.includes("Federico") :
      t.assignee.includes("Conjunto");

    return matchPhase && matchWeek && matchDay && matchAssignee;
  });

  // Métricas de Progreso
  const weekTasks = tasks.filter(t => t.phase_number === selectedPhase && t.week_number === selectedWeek);
  const rodrigoTasks = weekTasks.filter(t => t.assignee.includes("Rodrigo") || t.assignee.includes("Conjunto"));
  const federicoTasks = weekTasks.filter(t => t.assignee.includes("Federico") || t.assignee.includes("Conjunto"));

  const rodrigoDone = rodrigoTasks.filter(t => t.status === "Completado").length;
  const federicoDone = federicoTasks.filter(t => t.status === "Completado").length;
  const totalDone = weekTasks.filter(t => t.status === "Completado").length;

  const rodrigoPct = rodrigoTasks.length ? Math.round((rodrigoDone / rodrigoTasks.length) * 100) : 0;
  const federicoPct = federicoTasks.length ? Math.round((federicoDone / federicoTasks.length) * 100) : 0;
  const totalPct = weekTasks.length ? Math.round((totalDone / weekTasks.length) * 100) : 0;

  const daysList: ("Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes")[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      
      {/* HEADER TIPO CONTROL ROOM */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              NEXUS NODE <span className="text-emerald-400 font-mono text-xl">// SPRINT CONTROL</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Motor de ejecución de alta velocidad: <span className="text-slate-200 font-semibold">8 Subtareas Diarias</span> (4 Rodrigo / 4 Federico)
          </p>
        </div>

        {/* NAVEGACIÓN DE FASES */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {[
            { num: 1, label: "Fase 1: MVP & Launch" },
            { num: 2, label: "Fase 2: Escrow & Legal" },
            { num: 3, label: "Fase 3: AI Autonomy" },
            { num: 4, label: "Fase 4: Multi-Commodity" }
          ].map((p) => (
            <button
              key={p.num}
              onClick={() => {
                setSelectedPhase(p.num);
                setSelectedWeek(p.num === 1 ? 1 : p.num === 2 ? 5 : p.num === 3 ? 9 : 13);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPhase === p.num
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRICAS KPI DE CRECIMIENTO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> Target Semana 1
          </div>
          <div className="text-2xl font-bold text-white">40 Subtareas</div>
          <div className="text-xs text-slate-400 mt-1">8 Subtareas / Día</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> Leads Calificados
          </div>
          <div className="text-2xl font-bold text-white">50 Prospectos</div>
          <div className="text-xs text-slate-400 mt-1">Mineras Cobre / Oro</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Rocket className="w-3.5 h-3.5 text-purple-400" /> Outbound Target
          </div>
          <div className="text-2xl font-bold text-white">5 Demos</div>
          <div className="text-xs text-slate-400 mt-1">Reuniones Objetivo</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Target Piloto GMV
          </div>
          <div className="text-2xl font-bold text-amber-400">$100k+ USD</div>
          <div className="text-xs text-slate-400 mt-1">Primer Contrato</div>
        </div>
      </div>

      {/* BARRAS DE PROGRESO DE FUNDADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Rodrigo */}
        <div className="bg-slate-900/80 border border-blue-900/30 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                RC
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rodrigo (CEO & Tech)</h3>
                <p className="text-[10px] text-slate-400">Arquitectura, APIs & Seguridad</p>
              </div>
            </div>
            <span className="text-2xl font-black text-blue-400">{rodrigoPct}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50" style={{ width: `${rodrigoPct}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-mono">
            <span>Completadas: {rodrigoDone} / {rodrigoTasks.length}</span>
            <span>Semana {selectedWeek}</span>
          </div>
        </div>

        {/* Federico */}
        <div className="bg-slate-900/80 border border-purple-900/30 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-xs">
                FC
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Federico (COO & Ops)</h3>
                <p className="text-[10px] text-slate-400">Prospección, Outbound & Legal</p>
              </div>
            </div>
            <span className="text-2xl font-black text-purple-400">{federicoPct}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
            <div className="bg-purple-500 h-2 rounded-full transition-all duration-500 shadow-sm shadow-purple-500/50" style={{ width: `${federicoPct}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-mono">
            <span>Completadas: {federicoDone} / {federicoTasks.length}</span>
            <span>Semana {selectedWeek}</span>
          </div>
        </div>

        {/* Avance General */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Progreso General Sprint</h3>
                <p className="text-[10px] text-emerald-400">Meta: 100% Ejecución</p>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-400">{totalPct}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/50" style={{ width: `${totalPct}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-mono">
            <span>Total: {totalDone} / {weekTasks.length} Subtareas</span>
            <span>Velocidad: Alta</span>
          </div>
        </div>

      </div>

      {/* CONTROLES DE FILTRADO Y PESTAÑAS DÍA POR DÍA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
        
        {/* Selector de Días + Filtro por Responsable */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
          
          {/* Días de la semana */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            <button
              onClick={() => setSelectedDay("TODOS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDay === "TODOS"
                  ? "bg-slate-800 text-white border border-slate-700 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todos los Días ({weekTasks.length})
            </button>
            {daysList.map((day) => {
              const dayCount = weekTasks.filter(t => t.day_name === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedDay === day
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>{day}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedDay === day ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                    {dayCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtro por Responsable */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end lg:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <button
              onClick={() => setAssigneeFilter("TODOS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${assigneeFilter === "TODOS" ? "bg-slate-800 text-white" : "text-slate-400"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setAssigneeFilter("RODRIGO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${assigneeFilter === "RODRIGO" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400"}`}
            >
              Rodrigo
            </button>
            <button
              onClick={() => setAssigneeFilter("FEDERICO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${assigneeFilter === "FEDERICO" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-slate-400"}`}
            >
              Federico
            </button>
          </div>

        </div>

        {/* LISTADO DE SUBTAREAS DETALLADAS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Subtareas para: <span className="text-emerald-400">{selectedDay}</span> (Fase {selectedPhase} / Semana {selectedWeek})
            </h2>
            <span className="text-xs text-slate-500 font-mono">Mostrando {filteredTasks.length} subtareas</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No hay subtareas con los filtros seleccionados.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id}
                className={`p-5 rounded-2xl border transition-all ${
                  task.status === "Completado" 
                    ? "bg-slate-950/60 border-emerald-900/40 opacity-80" 
                    : task.status === "En Progreso"
                    ? "bg-slate-950 border-blue-500/40 shadow-lg shadow-blue-500/5"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-3">
                  
                  {/* Título & Badge de Responsable */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                      #{task.step_order}
                    </span>
                    <h3 className={`text-base font-bold ${task.status === "Completado" ? "line-through text-slate-400" : "text-white"}`}>
                      {task.title}
                    </h3>
                  </div>

                  {/* Badges de Asignado + Estado */}
                  <div className="flex items-center gap-2 self-end lg:self-auto">
                    
                    {/* Badge Asignado */}
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      task.assignee.includes("Rodrigo") ? "bg-blue-950/60 border-blue-800/60 text-blue-400" :
                      task.assignee.includes("Federico") ? "bg-purple-950/60 border-purple-800/60 text-purple-400" :
                      "bg-amber-950/60 border-amber-800/60 text-amber-400"
                    }`}>
                      {task.assignee}
                    </span>

                    {/* Selector de Estado */}
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as Task["status"])}
                      className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer bg-slate-900 outline-none ${
                        task.status === "Completado" ? "border-emerald-500 text-emerald-400" :
                        task.status === "En Progreso" ? "border-blue-500 text-blue-400" :
                        "border-slate-700 text-slate-400"
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Completado">Completado</option>
                    </select>

                    {/* Botón Prompt IA */}
                    <button
                      onClick={() => setActivePromptModal(task)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Prompt IA
                    </button>

                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4">{task.description}</p>

                {/* DESGLOSE DETALLADO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Paso a Paso:</span>
                    <p className="text-slate-300">{task.step_by_step}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Criterio de Perfección:</span>
                    <p className="text-slate-300">{task.ideal_perfection_goal}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Impacto Estratégico:</span>
                    <p className="text-slate-300">{task.impact_purpose}</p>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* REPORTE EJECUTIVO DE CIERRE SEMANAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reporte Ejecutivo de Cierre — Semana {selectedWeek}</h2>
            <p className="text-xs text-slate-400">Evaluación consolidada de avance y dirección estratégica de los fundadores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> ¿Dónde estamos parados?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fase {selectedPhase} / Semana {selectedWeek} en ejecución. Infraestructura técnica desplegada en Vercel + Supabase con RLS habilitado y motor outbound autenticado listo para emitir comunicaciones.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> ¿Qué logramos esta semana?
            </h4>
            <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
              <li>100% de la arquitectura SQL y seguridad RLS configurada.</li>
              <li>50 Leads de mineras de Cobre/Oro verificados en base de datos.</li>
              <li>Integración de envíos por Resend API con autenticación SPF/DKIM.</li>
              <li>5 Demos agendadas para avanzar en la canalización comercial.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-400" /> ¿Qué sigue la próxima semana?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Iniciar la Semana 2 ejecutando las reuniones comerciales de demostración, entregar el acuerdo de términos preliminares (Term Sheet) de 1 página y cerrar el primer contrato piloto ($100k+ USD GMV).
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-amber-400" /> Visión Estratégica
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidar a Nexus Node como la plataforma de intermediación y garantía de liquidez indispensable para la minería mediana en Latinoamérica dentro de los primeros 90 días.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL EMERGENTE PARA PROMPT DE IA */}
      {activePromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" /> Prompt de Rescate IA
              </div>
              <button 
                onClick={() => setActivePromptModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-full"
              >
                Cerrar ✕
              </button>
            </div>

            <h3 className="text-base font-bold text-white mb-2">{activePromptModal.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{activePromptModal.description}</p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 mb-6 max-h-60 overflow-y-auto leading-relaxed">
              {activePromptModal.ai_rescue_prompt}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleCopyPrompt(activePromptModal.ai_rescue_prompt)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPrompt ? "¡Copiado al Portapapeles!" : "Copiar Prompt para la IA"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
