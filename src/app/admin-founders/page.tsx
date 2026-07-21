'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Goal {
  id: string;
  phase_number: number;
  title: string;
  timeframe: string;
  kpi_target: string;
  progress_percentage: number;
}

interface Task {
  id: string;
  goal_id: string;
  week_label: string;
  step_order: number;
  title: string;
  description: string;
  impact_purpose: string;
  assignee: 'Rodrigo (CEO & Tech)' | 'Federico (COO)' | 'Rodrigo & Federico (Conjunto)';
  status: 'Pendiente' | 'En Progreso' | 'Completada';
  ai_rescue_prompt: string;
}

export default function FoundersDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'ALL'>('ALL');
  const [activeAssignee, setActiveAssignee] = useState<string>('ALL');
  const [selectedPrompt, setSelectedPrompt] = useState<{ title: string; prompt: string; assignee: string; impact: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar datos y calcular avance dinámico
  const fetchData = async () => {
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .order('phase_number', { ascending: true }); // Orden estricto 1 -> 2 -> 3 -> 4

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('step_order', { ascending: true });

    if (goalsData && tasksData) {
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

    const tasksSub = supabase.channel('realtime_tasks_v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSub);
    };
  }, []);

  const updateStatus = async (taskId: string, newStatus: 'Pendiente' | 'En Progreso' | 'Completada') => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completada').length;
  const globalVelocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtrado de tareas
  const filteredTasks = tasks.filter((t) => {
    const matchesGoal = selectedGoalId === 'ALL' || t.goal_id === selectedGoalId;
    const matchesAssignee = activeAssignee === 'ALL' || t.assignee.includes(activeAssignee);
    return matchesGoal && matchesAssignee;
  });

  // Agrupar tareas filtradas por Semana
  const weeks = Array.from(new Set(filteredTasks.map((t) => t.week_label)));

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
            Rodrigo (CEO & Tech/Product) & Federico (COO & BD/Ops) | Roadmap a Unicornio
          </p>
        </div>

        {/* MÉTRICAS GLOBALES DE AVANCE */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl font-mono text-xs shadow-lg">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Velocidad Global</span>
            <span className="text-emerald-400 font-bold text-base">{globalVelocity}% COMPLETADO</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Hitos Alcanzados</span>
            <span className="text-white font-bold text-base">{completedTasks} / {totalTasks} TAREAS</span>
          </div>
        </div>
      </header>

      {/* SECCIÓN DE FASES SECUENCIALES (1 -> 2 -> 3 -> 4) */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span>🗺️</span> Fases Estratégicas de Crecimiento (Selecciona una fase):
          </h2>
          {selectedGoalId !== 'ALL' && (
            <button
              onClick={() => setSelectedGoalId('ALL')}
              className="text-xs font-mono text-emerald-400 hover:underline"
            >
              ✕ Ver Todas las Fases
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-bold border border-slate-800">
                    Fase {goal.phase_number}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{goal.progress_percentage}%</span>
                </div>
                <h3 className="font-bold text-sm text-white mb-1 line-clamp-1">{goal.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono mb-2">{goal.timeframe}</p>
                <p className="text-[11px] text-slate-400 font-mono mb-3 line-clamp-2">
                  {goal.kpi_target}
                </p>

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

      {/* CONTROLES DE FILTRO DE SOCIOS */}
      <section className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveAssignee('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Todos los Trabajos
          </button>
          <button
            onClick={() => setActiveAssignee('Rodrigo')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Rodrigo' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Rodrigo (CEO & Tech Lead)
          </button>
          <button
            onClick={() => setActiveAssignee('Federico')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Federico' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Federico (COO & Field Ops)
          </button>
          <button
            onClick={() => setActiveAssignee('Conjunto')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Conjunto' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            🤝 Tareas Conjuntas (Fundadores)
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 px-3">
          Mostrando <strong className="text-white">{filteredTasks.length}</strong> tareas ordenadas por cronograma
        </div>
      </section>

      {/* DESGLOSE DE TAREAS ORGANIZADAS POR SEMANAS */}
      <section className="space-y-8">
        {weeks.map((week) => {
          const weekTasks = filteredTasks.filter((t) => t.week_label === week);
          return (
            <div key={week} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                  📅 {week}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {weekTasks.filter((t) => t.status === 'Completada').length} de {weekTasks.length} tareas listas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekTasks.map((task) => (
                  <TaskInteractiveCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateStatus(task.id, status)}
                    onOpenPrompt={() => setSelectedPrompt({ 
                      title: task.title, 
                      prompt: task.ai_rescue_prompt, 
                      assignee: task.assignee,
                      impact: task.impact_purpose
                    })}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* MODAL INTERACTIVO CON DETALLE E IMPACTO ESTRATÉGICO */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedPrompt.assignee}
                </span>
                <h3 className="font-bold text-base text-white mt-1">{selectedPrompt.title}</h3>
              </div>
              <button onClick={() => setSelectedPrompt(null)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <div className="mb-4 bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold mb-1">🎯 Propósito Estratégico & Valor Real:</span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedPrompt.impact}</p>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Copia este prompt y pégalo en <strong>Cursor (`Cmd + K`)</strong> o <strong>Claude 3.5 Sonnet</strong> para resolver esta tarea ahora mismo:
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

// COMPONENTE TARJETA INTERACTIVA DE TAREA CON IMPACTO Y ACCIONES DIRECTAS
function TaskInteractiveCard({
  task,
  onStatusChange,
  onOpenPrompt,
}: {
  task: Task;
  onStatusChange: (status: 'Pendiente' | 'En Progreso' | 'Completada') => void;
  onOpenPrompt: () => void;
}) {
  const isJoint = task.assignee.includes('Conjunto');

  return (
    <div className={`bg-slate-950 border rounded-xl p-4 flex flex-col justify-between transition-all ${
      task.status === 'Completada'
        ? 'border-emerald-500/30 bg-emerald-950/10'
        : isJoint
        ? 'border-purple-500/40 bg-purple-950/10'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      <div>
        {/* ETIQUETA DE ASIGNACIÓN */}
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            isJoint
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : task.assignee.includes('Rodrigo')
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {task.assignee}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Paso #{task.step_order}</span>
        </div>

        <h4 className={`font-semibold text-sm mb-2 ${task.status === 'Completada' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
          {task.title}
        </h4>

        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{task.description}</p>

        {/* IMPACTO ESTRATÉGICO DIRECTO */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 mb-4">
          <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold block mb-0.5">🚀 ¿Para qué sirve?</span>
          <p className="text-[11px] text-slate-300 leading-normal">{task.impact_purpose}</p>
        </div>
      </div>

      {/* CONTROLES TÁCTILES Y PROMPT AI */}
      <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
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
