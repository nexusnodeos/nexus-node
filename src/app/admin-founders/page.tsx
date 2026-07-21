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
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'ALL'>('ALL');
  const [activeAssignee, setActiveAssignee] = useState<'ALL' | 'Rodrigo' | 'Federico'>('ALL');
  const [selectedPrompt, setSelectedPrompt] = useState<{ title: string; prompt: string; assignee: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Carga de datos y suscripción en tiempo real
  const fetchData = async () => {
    const { data: goalsData } = await supabase.from('goals').select('*').order('timeframe', { ascending: true });
    const { data: tasksData } = await supabase.from('tasks').select('*');

    if (goalsData && tasksData) {
      // Recalcular el progreso dinámico de cada meta según el número de tareas completadas
      const updatedGoals = goalsData.map((goal) => {
        const goalTasks = tasksData.filter((t) => t.goal_id === goal.id);
        const completed = goalTasks.filter((t) => t.status === 'Completada').length;
        const progress = goalTasks.length > 0 ? Math.round((completed / goalTasks.length) * 100) : 0;
        return { ...goal, progress_percentage: progress };
      });

      setGoals(updatedGoals);
      setTasks(tasksData as Task[]);
    }
  };

  useEffect(() => {
    fetchData();

    const tasksSub = supabase.channel('realtime_tasks_v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSub);
    };
  }, []);

  // Actualizador directo de estado desde botones
  const updateStatus = async (taskId: string, newStatus: 'Pendiente' | 'En Progreso' | 'Completada') => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cálculo de Métricas Globales
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completada').length;
  const globalVelocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtrado de Tareas
  const filteredTasks = tasks.filter((t) => {
    const matchesGoal = selectedGoalId === 'ALL' || t.goal_id === selectedGoalId;
    const matchesAssignee = activeAssignee === 'ALL' || t.assignee === activeAssignee;
    return matchesGoal && matchesAssignee;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* CABECERA EJECUTIVA */}
      <header className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-2xl font-black tracking-wider text-white uppercase font-mono">
              NEXUS NODE <span className="text-emerald-400">// CONTROL ROOM</span>
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Rodrigo (CEO & Tech/Product) & Federico (COO & BD/Ops) | Avance Hacia Valuación Unicornio
          </p>
        </div>

        {/* METRICAS GLOBALES */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl font-mono text-xs shadow-lg">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Progreso Global</span>
            <span className="text-emerald-400 font-bold text-base">{globalVelocity}% UNICORN ROAD</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Tareas Listas</span>
            <span className="text-white font-bold text-base">{completedTasks} / {totalTasks} DONE</span>
          </div>
        </div>
      </header>

      {/* SECCIÓN DE FASES Y METAS CLICABLES */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span>🎯</span> Selecciona una Fase para Filtrar el Tablero:
          </h2>
          {selectedGoalId !== 'ALL' && (
            <button
              onClick={() => setSelectedGoalId('ALL')}
              className="text-xs font-mono text-emerald-400 hover:underline"
            >
              ✕ Mostrar Todas las Fases
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.map((goal) => {
            const isSelected = selectedGoalId === goal.id;
            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {goal.timeframe}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{goal.progress_percentage}%</span>
                </div>
                <h3 className="font-bold text-sm text-white mb-2 line-clamp-1">{goal.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono mb-3 line-clamp-2">
                  {goal.kpi_target}
                </p>

                {/* BARRA DE PROGRESO */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${goal.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTROLES Y FILTROS DE FUNDADORES */}
      <section className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveAssignee('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Todos los Co-Fundadores
          </button>
          <button
            onClick={() => setActiveAssignee('Rodrigo')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Rodrigo' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Rodrigo (CEO / Tech & Strategy)
          </button>
          <button
            onClick={() => setActiveAssignee('Federico')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Federico' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Federico (COO / BD & Operations)
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 px-3">
          Mostrando <strong className="text-white">{filteredTasks.length}</strong> tareas de ejecución
        </div>
      </section>

      {/* REJILLA PRINCIPAL DE TAREAS INTERACTIVAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COLUMNA RODRIGO */}
        {(activeAssignee === 'ALL' || activeAssignee === 'Rodrigo') && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold font-mono flex items-center justify-center text-xs">
                  CEO
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Rodrigo</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Product, Engineering & Vision</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                {filteredTasks.filter((t) => t.assignee === 'Rodrigo' && t.status === 'Completada').length} / {filteredTasks.filter((t) => t.assignee === 'Rodrigo').length} Completadas
              </span>
            </div>

            <div className="space-y-4">
              {filteredTasks
                .filter((t) => t.assignee === 'Rodrigo')
                .map((task) => (
                  <TaskInteractiveCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateStatus(task.id, status)}
                    onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt, assignee: task.assignee })}
                  />
                ))}
            </div>
          </div>
        )}

        {/* COLUMNA FEDERICO */}
        {(activeAssignee === 'ALL' || activeAssignee === 'Federico') && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center text-xs">
                  COO
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Federico</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Operations, BD & Legal Execution</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {filteredTasks.filter((t) => t.assignee === 'Federico' && t.status === 'Completada').length} / {filteredTasks.filter((t) => t.assignee === 'Federico').length} Completadas
              </span>
            </div>

            <div className="space-y-4">
              {filteredTasks
                .filter((t) => t.assignee === 'Federico')
                .map((task) => (
                  <TaskInteractiveCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateStatus(task.id, status)}
                    onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt, assignee: task.assignee })}
                  />
                ))}
            </div>
          </div>
        )}

      </section>

      {/* MODAL DE AI RESCUE PROMPT */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  AI Execution Prompt // {selectedPrompt.assignee}
                </span>
                <h3 className="font-bold text-base text-white mt-1">{selectedPrompt.title}</h3>
              </div>
              <button onClick={() => setSelectedPrompt(null)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Copia este prompt y pégalo en <strong>Cursor (Cmd + K)</strong> o <strong>Claude 3.5 Sonnet</strong> para resolver esta tarea de inmediato:
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-emerald-300 mb-5 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {selectedPrompt.prompt}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedPrompt(null)} className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400">
                Cerrar
              </button>
              <button
                onClick={() => copyToClipboard(selectedPrompt.prompt)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <span>⚡</span>
                <span>{copied ? '¡Copiado!' : 'Copiar Prompt a Portapapeles'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTE TARJETA INTERACTIVA DE TAREA
function TaskInteractiveCard({
  task,
  onStatusChange,
  onOpenPrompt,
}: {
  task: Task;
  onStatusChange: (status: 'Pendiente' | 'En Progreso' | 'Completada') => void;
  onOpenPrompt: () => void;
}) {
  return (
    <div className={`bg-slate-950 border rounded-xl p-4 transition-all ${
      task.status === 'Completada' ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-semibold text-sm ${task.status === 'Completada' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
          {task.title}
        </h4>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{task.description}</p>

      {/* BOTONES INTERACTIVOS DE CAMBIO DE ESTADO */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-900">
        
        {/* Selector Botones Directos */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => onStatusChange('Pendiente')}
            className={`px-2 py-1 rounded transition ${
              task.status === 'Pendiente' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ⏳ Pendiente
          </button>
          <button
            onClick={() => onStatusChange('En Progreso')}
            className={`px-2 py-1 rounded transition ${
              task.status === 'En Progreso' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🚀 En Progreso
          </button>
          <button
            onClick={() => onStatusChange('Completada')}
            className={`px-2 py-1 rounded transition ${
              task.status === 'Completada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ✓ Lista
          </button>
        </div>

        {/* Botón Prompt IA */}
        {task.ai_rescue_prompt && (
          <button
            onClick={onOpenPrompt}
            className="text-[11px] text-emerald-400 hover:underline font-mono flex items-center gap-1"
          >
            <span>⚡ Prompt IA</span>
          </button>
        )}
      </div>
    </div>
  );
}
