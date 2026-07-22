'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Task {
  id: string;
  week: number;
  assignee: 'rodrigo' | 'federico';
  task_code: string;
  title: string;
  description: string;
  prompt: string;
  completed: boolean;
}

// DATA MAESTRA DE TAREAS (4 SEMANAS)
const INITIAL_TASKS: Task[] = [
  // --- SEMANA 1 ---
  {
    id: 's1-r-1.1',
    week: 1,
    assignee: 'rodrigo',
    task_code: '1.1',
    title: 'Agente SDR Inbound Anti-Fraude',
    description: 'Definir reglas para analizar la documentación subida por los vendedores.',
    prompt: `Actúa como Senior Legal & Compliance Prompt Engineer. Diseña el prompt del sistema y el flujo lógico para un 'Agente SDR Inbound Anti-Fraude' en Nexus. El agente debe recibir un JSON con metadatos de documentos cargados (título de concesión minera, análisis de laboratorio, identificaciones). Debe evaluar inconsistencias, validar formatos y devolver un score de validez (0-100). Si es <80%, genera una razón de rechazo detallada; si es >=80%, aprueba el lote y desencadena el contrato de exclusividad de 72 horas.`,
    completed: false
  },
  {
    id: 's1-r-1.2',
    week: 1,
    assignee: 'rodrigo',
    task_code: '1.2',
    title: 'Plantillas de Contrato',
    description: 'Redactar los borradores legales del contrato de exclusividad (72 hrs) y NCNDA.',
    prompt: `Actúa como Abogado Corporativo especialista en Commodities y Minería. Redacta dos plantillas de contrato redactadas de forma profesional pero listas con variables Markdown/HTML (ej: {{vendedor_nombre}}, {{lote_id}}, {{volumen}}, {{fecha}}): 1) Contrato de Exclusividad de Venta por 72 horas para Nexus. 2) Acuerdo de Confidencialidad y No Circunvención (NCNDA). Incluye cláusulas de penalización por doble venta durante la ventana de 72 horas.`,
    completed: false
  },
  {
    id: 's1-r-1.3',
    week: 1,
    assignee: 'rodrigo',
    task_code: '1.3',
    title: 'Criterios de Validación de Vendedores',
    description: 'Establecer checklist de ponderación de riesgo para el agente SDR.',
    prompt: `Actúa como Product Designer UX/UI para un B2B Marketplace de Commodities. Genera el esquema de campos en formato JSON para el formulario de carga de lotes por parte de mineras. Incluye: Tipo de mineral, ley/pureza (%), volumen (toneladas), ubicación exacta, precio mínimo de venta (USD/ton), disponibilidad de entrega y checklist de documentos adjuntos obligatorios.`,
    completed: false
  },
  {
    id: 's1-f-1.1',
    week: 1,
    assignee: 'federico',
    task_code: '1.1',
    title: 'Schema Relacional de Supabase',
    description: 'Crear tablas en Supabase (users, lots, documents, matches).',
    prompt: `Actúa como Senior Database Architect especialista en Supabase / PostgreSQL. Genera el script SQL DDL para crear las tablas: 'users' (roles: buyer, seller), 'lots' (detalles del mineral, precio min, status), 'documents' (URL, status_verificacion, score_fraude), 'matches' (buyer_id, lot_id, score, status), y 'agent_activity_logs' (agent_name, step, payload, timestamp). Incluye Row Level Security (RLS) e índices de desempeño.`,
    completed: false
  },
  {
    id: 's1-f-1.2',
    week: 1,
    assignee: 'federico',
    task_code: '1.2',
    title: 'Arquitectura de Cola Asíncrona',
    description: 'Configurar backend para procesamiento asíncrono de documentos.',
    prompt: `Actúa como Principal Backend Engineer especialista en sistemas distribuidos y concurrencia. Diseña una arquitectura de colas de mensajes asíncronas en Node.js/TypeScript usando Redis/BullMQ o Supabase Background Workers. Crea el código para un worker que procese la verificación de documentos de múltiples lotes en paralelo, evitando bloqueos en la API cuando entren más de 5 peticiones simultáneas.`,
    completed: false
  },
  {
    id: 's1-f-1.3',
    week: 1,
    assignee: 'federico',
    task_code: '1.3',
    title: 'Conexión de Storage Supabase',
    description: 'Configurar buckets de almacenamiento seguro para PDFs de los lotes.',
    prompt: `Actúa como Cloud Security & Supabase Expert. Proporciona el script SQL/CLI de Supabase para crear un bucket de almacenamiento privado llamado 'kyc-documents'. Configura las políticas de seguridad (Storage RLS) para que solo el propietario y las Edge Functions de los Agentes puedan leer/escribir archivos.`,
    completed: false
  },

  // --- SEMANA 2 ---
  {
    id: 's2-r-2.1',
    week: 2,
    assignee: 'rodrigo',
    task_code: '2.1',
    title: 'Agente Legal & Compliance Firma',
    description: 'Definir reglas para validar firmas en PDFs de contratos.',
    prompt: `Actúa como Legaltech Specialist. Diseña el prompt para el Agente Legal & Compliance que audita un contrato PDF firmado. Debe verificar que contenga las firmas de ambas partes, fechas válidas y que las cláusulas no hayan sido alteradas.`,
    completed: false
  },
  {
    id: 's2-r-2.2',
    week: 2,
    assignee: 'rodrigo',
    task_code: '2.2',
    title: 'Diseño UX Firma Digital',
    description: 'Definir flujo donde comprador y vendedor plasman su firma digital.',
    prompt: `Actúa como UX Designer. Diseña el flujo modal para firma de documentos en la web. Incluye el visor PDF, checkbox de aceptación de términos legales y un canvas para firma digitalizada o botón de "Firma Electrónica Un Clic".`,
    completed: false
  },
  {
    id: 's2-f-2.1',
    week: 2,
    assignee: 'federico',
    task_code: '2.1',
    title: 'Componente Canvas / Firma Digital',
    description: 'Crear componente React para capturar firma digitalizada.',
    prompt: `Actúa como Frontend Developer. Crea un componente en React Signature Modal usando react-signature-canvas. Al guardar, debe exportar la imagen en base64 y enviarla a la Edge Function de firma de contratos.`,
    completed: false
  },
  {
    id: 's2-f-2.2',
    week: 2,
    assignee: 'federico',
    task_code: '2.2',
    title: 'Estampado de Firma en PDF',
    description: 'Backend para incrustar la imagen PNG de la firma en el PDF.',
    prompt: `Actúa como Node.js Engineer. Escribe una función usando 'pdf-lib' que abra el contrato PDF almacenado, inserte la imagen PNG de la firma en las coordenadas X,Y de la última página y reemplace el archivo por la versión firmada.`,
    completed: false
  },

  // --- SEMANA 3 ---
  {
    id: 's3-r-3.1',
    week: 3,
    assignee: 'rodrigo',
    task_code: '3.1',
    title: 'Ejecución Simulación #1 (Flujo Limpio)',
    description: 'Iniciar la primera prueba E2E completa con datos de Cobre.',
    prompt: `Actúa como QA Test Director. Genera la hoja de ruta en tiempo real para ejecutar la Simulación #1. Registra tiempos de entrega de emails, efectividad de la extracción de datos y rendimiento de la interfaz.`,
    completed: false
  },
  {
    id: 's3-f-3.1',
    week: 3,
    assignee: 'federico',
    task_code: '3.1',
    title: 'Monitoreo de Logs en Vivo S#1',
    description: 'Monitorear terminal y Supabase durante la prueba E2E.',
    prompt: `Actúa como DevOps Engineer. Crea un script de monitoreo en tiempo real que haga polling a la tabla 'agent_activity_logs' e imprima en consola de colores los eventos que contengan el estado 'ERROR' o 'WARN'.`,
    completed: false
  },

  // --- SEMANA 4 ---
  {
    id: 's4-r-4.1',
    week: 4,
    assignee: 'rodrigo',
    task_code: '4.1',
    title: 'Configuración Simulación Final Autónoma',
    description: 'Prueba definitiva de 3 lotes sin intervención manual.',
    prompt: `Actúa como Chief Master Tester. Prepara la guía de ejecución para la Simulación Final de Autonomía 100%. Define los roles de prueba, los datos de los lotes y los criterios de aceptación donde el sistema debe pasar de la prospección al cierre sin intervención humana.`,
    completed: false
  },
  {
    id: 's4-f-4.1',
    week: 4,
    assignee: 'federico',
    task_code: '4.1',
    title: 'Despliegue Producción Final Vercel',
    description: 'Asegurar la compilación final y variables de entorno de producción.',
    prompt: `Actúa como Lead DevOps. Verifica la configuración de despliegue en Vercel. Habilita compresión de assets, almacenamiento en caché de bordes (Edge Caching) y optimización de variables de producción en Supabase.`,
    completed: false
  }
];

export default function FoundersDashboard() {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cargar tareas desde Supabase al iniciar
  const fetchTasks = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('founder_tasks').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        setTasks((prev) =>
          prev.map((t) => {
            const remote = data.find((d: any) => d.id === t.id);
            return remote ? { ...t, completed: remote.completed } : t;
          })
        );
      } else {
        // Si la tabla está vacía, la inicializamos
        await supabase.from('founder_tasks').upsert(
          INITIAL_TASKS.map((t) => ({
            id: t.id,
            week: t.week,
            assignee: t.assignee,
            task_code: t.task_code,
            title: t.title,
            description: t.description,
            prompt: t.prompt,
            completed: t.completed,
          }))
        );
      }
    } catch (e) {
      console.warn('Operando en modo local (sin conexión DB inmediata)');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Listener Realtime
    const channel = supabase
      .channel('realtime_founder_tasks')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'founder_tasks' },
        (payload) => {
          const updated = payload.new as Task;
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, completed: updated.completed } : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);

    const target = updatedTasks.find((t) => t.id === id);
    if (target) {
      await supabase
        .from('founder_tasks')
        .upsert({ id: target.id, completed: target.completed, updated_at: new Date().toISOString() });
    }
  };

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cálculos de Porcentaje
  const currentWeekTasks = tasks.filter((t) => t.week === activeWeek);
  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalProgress = Math.round((totalCompleted / totalTasks) * 100) || 0;

  const weekTasks = currentWeekTasks.length;
  const weekCompleted = currentWeekTasks.filter((t) => t.completed).length;
  const weekProgress = Math.round((weekCompleted / weekTasks) * 100) || 0;

  const rodrigoWeekTasks = currentWeekTasks.filter((t) => t.assignee === 'rodrigo');
  const federicoWeekTasks = currentWeekTasks.filter((t) => t.assignee === 'federico');

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 p-6 md:p-10 font-sans">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="text-blue-500">Nexus:</span> Dashboard de Progreso
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Meta: Prueba Piloto operando al 100% en 30 días.
          </p>
        </div>
        <button
          onClick={fetchTasks}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition"
        >
          <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}
        </button>
      </div>

      {/* METRICAS Y PROGRESO */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#131926] p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400">Progreso Total (30 Días)</span>
            <span className="text-xs font-bold text-blue-400">{totalProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#131926] p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400">Progreso Semana {activeWeek}</span>
            <span className="text-xs font-bold text-emerald-400">{weekProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${weekProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* TABS DE SEMANAS */}
      <div className="max-w-7xl mx-auto flex gap-3 mb-8">
        {[1, 2, 3, 4].map((weekNum) => (
          <button
            key={weekNum}
            onClick={() => setActiveWeek(weekNum)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeWeek === weekNum
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#131926] text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Semana {weekNum}
          </button>
        ))}
      </div>

      {/* COLUMNAS DE TAREAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA RODRIGO (CEO) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <span>👤</span> Tus Tareas (Estrategia y Prompts)
            </h2>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
              {rodrigoWeekTasks.filter((t) => t.completed).length} / {rodrigoWeekTasks.length}
            </span>
          </div>

          {rodrigoWeekTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onCopy={() => copyPrompt(task.id, task.prompt)}
              isCopied={copiedId === task.id}
            />
          ))}
        </div>

        {/* COLUMNA FEDERICO */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <span>💻</span> Federico (Desarrollo e Infraestructura)
            </h2>
            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs px-2.5 py-1 rounded-full font-mono">
              {federicoWeekTasks.filter((t) => t.completed).length} / {federicoWeekTasks.length}
            </span>
          </div>

          {federicoWeekTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onCopy={() => copyPrompt(task.id, task.prompt)}
              isCopied={copiedId === task.id}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

// COMPONENTE TARJETA DE TAREA
function TaskCard({
  task,
  onToggle,
  onCopy,
  isCopied,
}: {
  task: Task;
  onToggle: () => void;
  onCopy: () => void;
  isCopied: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        task.completed
          ? 'bg-[#0E131F]/60 border-slate-800/60 opacity-60'
          : 'bg-[#131926] border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-4">
        <h3 className={`font-bold text-sm text-slate-100 ${task.completed ? 'line-through text-slate-400' : ''}`}>
          {task.task_code}. {task.title}
        </h3>
        <button
          onClick={onToggle}
          className={`text-xs px-3 py-1 rounded-md font-semibold transition ${
            task.completed
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {task.completed ? '✓ Listo' : 'Marcar listo'}
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{task.description}</p>

      {/* BLOQUE DE PROMPT */}
      <div className="bg-[#090D14] rounded-lg p-3 border border-slate-800/80 relative group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-mono text-slate-500">// Prompt de trabajo:</span>
          <button
            onClick={onCopy}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {isCopied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs font-mono text-slate-300 line-clamp-2 leading-tight">
          {task.prompt}
        </p>
      </div>
    </div>
  );
}

