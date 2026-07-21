'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Goal {
  id: string;
  title: string;
  timeframe: string;
  kpi_target: string;
  progress_percentage: number;
}

interface Task {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  assignee: 'Rodrigo' | 'Federico';
  status: 'Pendiente' | 'En Progreso' | 'Completada';
  ai_rescue_prompt: string;
}

export default function FoundersDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'Rodrigo' | 'Federico'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pendiente' | 'En Progreso' | 'Completada'>('ALL');
  const [selectedPrompt, setSelectedPrompt] = useState<{ title: string; prompt: string; assignee: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    const { data: goalsData } = await supabase.from('goals').select('*').order('timeframe', { ascending: true });
    const { data: tasksData } = await supabase.from('tasks').select('*');

    if (goalsData) setGoals(goalsData);
    if (tasksData) setTasks(tasksData as Task[]);
  };

  useEffect(() => {
    fetchData();

    const tasksSub = supabase.channel('realtime_tasks_master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();

    const goalsSub = supabase.channel('realtime_goals_master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(goalsSub);
    };
  }, []);

  const toggleTaskStatus = async (task: Task) => {
    const statusMap: Record<string, 'Pendiente' | 'En Progreso' | 'Completada'> = {
      Pendiente: 'En Progreso',
      'En Progreso': 'Completada',
      Completada: 'Pendiente',
    };
    const newStatus = statusMap[task.status];
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Métricas globales
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completada').length;
  const globalVelocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    const matchesAssignee = activeTab === 'ALL' || t.assignee === activeTab;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesAssignee && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-10 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* HEADER DE CONTROL INSTITUCIONAL */}
      <header className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-2xl font-black tracking-wider text-white uppercase font-mono">
              NEXUS NODE <span className="text-emerald-400">// EXECUTIVE COMMAND</span>
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Sincronización en tiempo real de Fundadores | Rodrigo (CTO) & Federico (COO)
          </p>
        </div>

        {/* METRICAS DE CABECERA (KPI TICKER) */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl font-mono text-xs">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Velocidad de Sprints</span>
            <span className="text-emerald-400 font-bold text-sm">{globalVelocity}% EXECUTION</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Tareas Totales</span>
            <span className="text-white font-bold text-sm">{completedTasks}/{totalTasks} DONE</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Status Red</span>
            <span className="text-emerald-400 font-bold text-sm">● ONLINE</span>
          </div>
        </div>
      </header>

      {/* SECCIÓN 1: METAS Y ROADMAP ESTRATÉGICO (CORTO, MEDIANO Y LARGO PLAZO) */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span>🎯</span> Horizontes Estratégicos de Crecimiento & KPIs
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {goal.timeframe}
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{goal.progress_percentage}%</span>
                </div>
                <h3 className="font-bold text-base text-white mb-2">{goal.title}</h3>
                <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 mb-4">
                  <strong className="text-slate-300">KPI Target:</strong> {goal.kpi_target}
                </p>
              </div>

              <div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-700"
                    style={{ width: `${goal.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 2: MATRIZ DE TAREAS Y EJECUCIÓN (TABLERO DE COMANDO) */}
      <section className="space-y-6">
        
        {/* BARRA DE FILTROS Y CONTROLES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
          
          {/* Tabs Por Fundador */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition font-medium ${activeTab === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Todos ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('Rodrigo')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition font-medium ${activeTab === 'Rodrigo' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Rodrigo (CTO)
            </button>
            <button
              onClick={() => setActiveTab('Federico')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition font-medium ${activeTab === 'Federico' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Federico (COO)
            </button>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completada">Completada</option>
            </select>
          </div>
        </div>

        {/* REJILLA DE TAREAS ORGANIZADAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TAREAS RODRIGO (CTO) */}
          {(activeTab === 'ALL' || activeTab === 'Rodrigo') && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-mono">
                    CTO
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Rodrigo</h3>
                    <p className="text-xs text-slate-400 font-mono">Infraestructura, AI Agents & Tech</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                  {tasks.filter((t) => t.assignee === 'Rodrigo' && t.status === 'Completada').length}/
                  {tasks.filter((t) => t.assignee === 'Rodrigo').length} Listo
                </span>
              </div>

              <div className="space-y-4">
                {filteredTasks
                  .filter((t) => t.assignee === 'Rodrigo')
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTaskStatus(task)}
                      onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt, assignee: task.assignee })}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* TAREAS FEDERICO (COO) */}
          {(activeTab === 'ALL' || activeTab === 'Federico') && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
                    COO
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Federico</h3>
                    <p className="text-xs text-slate-400 font-mono">Operaciones, Legal, Escrow & BD</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                  {tasks.filter((t) => t.assignee === 'Federico' && t.status === 'Completada').length}/
                  {tasks.filter((t) => t.assignee === 'Federico').length} Listo
                </span>
              </div>

              <div className="space-y-4">
                {filteredTasks
                  .filter((t) => t.assignee === 'Federico')
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTaskStatus(task)}
                      onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt, assignee: task.assignee })}
                    />
                  ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* MODAL INSTITUCIONAL PARA AI RESCUE PROMPTS */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  AI Prompt de Ejecución // {selectedPrompt.assignee}
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{selectedPrompt.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Copia este prompt optimizado y pégalo directamente en <strong>Cursor (Cmd+K)</strong>, <strong>Claude 3.5 Sonnet</strong> o <strong>ChatGPT-4o</strong> para acelerar la resolución de esta tarea:
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-emerald-300 mb-5 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed shadow-inner">
              {selectedPrompt.prompt}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedPrompt(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => copyToClipboard(selectedPrompt.prompt)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <span>⚡</span>
                <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Prompt de IA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// TARJETA DE TAREA
function TaskCard({ task, onToggle, onOpenPrompt }: { task: Task; onToggle: () => void; onOpenPrompt: () => void }) {
  const statusStyles = {
    Pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    'En Progreso': 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
    Completada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  };

  return (
    <div className={`bg-slate-950 border rounded-xl p-4 transition-all ${task.status === 'Completada' ? 'border-slate-800/60 opacity-75' : 'border-slate-800 hover:border-slate-700'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-semibold text-sm ${task.status === 'Completada' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
          {task.title}
        </h4>
        <button
          onClick={onToggle}
          className={`text-[11px] font-mono px-3 py-1 rounded-full border transition cursor-pointer shrink-0 font-medium ${statusStyles[task.status]}`}
        >
          {task.status}
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{task.description}</p>

      {task.ai_rescue_prompt && (
        <button
          onClick={onOpenPrompt}
          className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition pt-2.5 border-t border-slate-900/80 w-full group"
        >
          <span className="group-hover:scale-125 transition-transform">⚡</span>
          <span>Desplegar AI Rescue Prompt</span>
        </button>
      )}
    </div>
  );
}
