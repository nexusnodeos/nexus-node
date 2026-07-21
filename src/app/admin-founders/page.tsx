'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicialización de cliente Supabase
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
  const [selectedPrompt, setSelectedPrompt] = useState<{ title: string; prompt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar datos iniciales
  const fetchData = async () => {
    const { data: goalsData } = await supabase.from('goals').select('*');
    const { data: tasksData } = await supabase.from('tasks').select('*');

    if (goalsData) setGoals(goalsData);
    if (tasksData) setTasks(tasksData as Task[]);
  };

  useEffect(() => {
    fetchData();

    // Configurar Supabase Realtime
    const tasksSubscription = supabase
      .channel('realtime_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchData();
      })
      .subscribe();

    const goalsSubscription = supabase
      .channel('realtime_goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(goalsSubscription);
    };
  }, []);

  // Cambiar estado de una tarea
  const toggleTaskStatus = async (task: Task) => {
    const statusMap: Record<string, 'Pendiente' | 'En Progreso' | 'Completada'> = {
      Pendiente: 'En Progreso',
      'En Progreso': 'Completada',
      Completada: 'Pendiente',
    };

    const newStatus = statusMap[task.status];

    await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rodrigoTasks = tasks.filter((t) => t.assignee === 'Rodrigo');
  const federicoTasks = tasks.filter((t) => t.assignee === 'Federico');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl font-bold tracking-wider text-white uppercase">
              Nexus Node <span className="text-emerald-400">// Control Room</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Sincronización en tiempo real de Co-Fundadores</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase tracking-widest block">Status del Ecosistema</span>
          <span className="text-emerald-400 text-sm font-mono font-semibold">● ONLINE (SYNC)</span>
        </div>
      </header>

      {/* Sección de Metas */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Metas de Crecimiento & KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                  {goal.timeframe} Plazo
                </span>
                <span className="text-xl font-mono font-bold text-emerald-400">{goal.progress_percentage}%</span>
              </div>
              <h3 className="font-semibold text-lg text-white mb-1">{goal.title}</h3>
              <p className="text-xs text-slate-400 font-mono">KPI Target: {goal.kpi_target}</p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${goal.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Columnas por Fundador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna Rodrigo */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                R
              </div>
              <div>
                <h2 className="font-bold text-white">Rodrigo</h2>
                <p className="text-xs text-slate-400">Chief Technology Officer (CTO)</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              {rodrigoTasks.filter((t) => t.status === 'Completada').length}/{rodrigoTasks.length} Done
            </span>
          </div>

          <div className="space-y-4">
            {rodrigoTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTaskStatus(task)} onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt })} />
            ))}
          </div>
        </div>

        {/* Columna Federico */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                F
              </div>
              <div>
                <h2 className="font-bold text-white">Federico</h2>
                <p className="text-xs text-slate-400">Chief Operating Officer (COO)</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
              {federicoTasks.filter((t) => t.status === 'Completada').length}/{federicoTasks.length} Done
            </span>
          </div>

          <div className="space-y-4">
            {federicoTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTaskStatus(task)} onOpenPrompt={() => setSelectedPrompt({ title: task.title, prompt: task.ai_rescue_prompt })} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal Prompt de Rescate IA */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>⚡ Prompt de Rescate IA:</span>
                <span className="text-slate-400 text-sm font-normal">{selectedPrompt.title}</span>
              </h3>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              ¿Te atoraste en esta tarea? Copia este prompt y pégalo en ChatGPT, Claude o Cursor para resolverla en minutos:
            </p>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-xs text-emerald-300 mb-4 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedPrompt.prompt}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => copyToClipboard(selectedPrompt.prompt)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition"
              >
                {copied ? '¡Copiado!' : 'Copiar Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la Tarjeta de Tarea
function TaskCard({ task, onToggle, onOpenPrompt }: { task: Task; onToggle: () => void; onOpenPrompt: () => void }) {
  const statusStyles = {
    Pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'En Progreso': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Completada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-semibold text-sm ${task.status === 'Completada' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {task.title}
        </h4>
        <button
          onClick={onToggle}
          className={`text-xs font-mono px-2.5 py-1 rounded-full border transition cursor-pointer shrink-0 ${statusStyles[task.status]}`}
        >
          {task.status}
        </button>
      </div>
      {task.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>}
      
      {task.ai_rescue_prompt && (
        <button
          onClick={onOpenPrompt}
          className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition pt-2 border-t border-slate-900 w-full"
        >
          <span>⚡</span>
          <span>Ver AI Rescue Prompt</span>
        </button>
      )}
    </div>
  );
}
