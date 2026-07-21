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
  week_number: number;
  week_label: string;
  weekly_goal: string;
  day_number: number;
  day_label: string;
  step_order: number;
  title: string;
  description: string;
  step_by_step: string;
  ideal_perfection_goal: string;
  impact_purpose: string;
  assignee: 'Rodrigo (CEO & Tech)' | 'Federico (COO)' | 'Rodrigo & Federico (Conjunto)';
  status: 'Pendiente' | 'En Progreso' | 'Completada';
  ai_rescue_prompt: string;
}

export default function DailyFoundersDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'ALL'>('ALL');
  const [activeAssignee, setActiveAssignee] = useState<string>('ALL');
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>('ALL');
  const [selectedPrompt, setSelectedPrompt] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar datos y calcular progreso dinámico
  const fetchData = async () => {
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .order('phase_number', { ascending: true });

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('day_number', { ascending: true })
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

    const tasksSub = supabase.channel('realtime_daily_tasks_v7')
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

  // Filtrado de subtareas
  const filteredTasks = tasks.filter((t) => {
    const matchesGoal = selectedGoalId === 'ALL' || t.goal_id === selectedGoalId;
    const matchesAssignee = activeAssignee === 'ALL' || t.assignee.includes(activeAssignee);
    const matchesDay = selectedDayLabel === 'ALL' || t.day_label === selectedDayLabel;
    return matchesGoal && matchesAssignee && matchesDay;
  });

  // Lista de semanas y días disponibles
  const weeks = Array.from(new Set(tasks.map((t) => t.week_label)));
  const days = Array.from(new Set(tasks.map((t) => t.day_label)));

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
              NEXUS NODE <span className="text-emerald-400">// DAILY SPRINT ROOM</span>
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Planificador Diario de Alta Velocidad (3-4 Subtareas/Día) | Rodrigo (CEO) & Federico (COO)
          </p>
        </div>

        {/* MÉTRICAS DE EJECUCIÓN */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl font-mono text-xs shadow-lg">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Ritmo de Ejecución</span>
            <span className="text-emerald-400 font-bold text-base">{globalVelocity}% COMPLETADO</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Subtareas Listas</span>
            <span className="text-white font-bold text-base">{completedTasks} / {totalTasks} TOTAL</span>
          </div>
        </div>
      </header>

      {/* SECCIÓN DE FASES */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span>🗺️</span> Fases Estratégicas (Fases 1 a 4):
          </h2>
          {selectedGoalId !== 'ALL' && (
            <button onClick={() => setSelectedGoalId('ALL')} className="text-xs font-mono text-emerald-400 hover:underline">
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
                <p className="text-[11px] text-slate-400 font-mono mb-3 line-clamp-2">{goal.kpi_target}</p>

                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${goal.progress_percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BARRA DE FILTROS POR DÍA Y SOCIO */}
      <section className="mb-6 space-y-4">
        {/* NAVEGACIÓN POR DÍAS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400 px-3 font-bold">Filtrar por Día:</span>
          <button
            onClick={() => setSelectedDayLabel('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
              selectedDayLabel === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Todos los Días
          </button>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayLabel(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                selectedDayLabel === day ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              📅 {day}
            </button>
          ))}
        </div>

        {/* FILTRADO POR RESPONSABLE */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveAssignee('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos los Fundadores
          </button>
          <button
            onClick={() => setActiveAssignee('Rodrigo')}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Rodrigo' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Rodrigo (CEO & Tech Lead)
          </button>
          <button
            onClick={() => setActiveAssignee('Federico')}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Federico' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Federico (COO & Ops)
          </button>
          <button
            onClick={() => setActiveAssignee('Conjunto')}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono transition ${
              activeAssignee === 'Conjunto' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🤝 Trabajo Conjunto
          </button>
        </div>
      </section>

      {/* SPRINT DIARIO ORGANIZADO POR SEMANAS Y DÍAS */}
      <section className="space-y-10">
        {weeks.map((week) => {
          const weekTasks = filteredTasks.filter((t) => t.week_label === week);
          if (weekTasks.length === 0) return null;

          const weeklyGoalTitle = weekTasks[0]?.weekly_goal || 'Meta Semanal';
          const weekDays = Array.from(new Set(weekTasks.map((t) => t.day_label)));

          return (
            <div key={week} className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              
              {/* META SEMANAL BANNER */}
              <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                      {week}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {weekTasks.filter((t) => t.status === 'Completada').length} de {weekTasks.length} subtareas avanzadas
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white font-mono">
                    🎯 {weeklyGoalTitle}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Cumplimiento Semanal</span>
                  <span className="text-emerald-400 font-mono font-bold text-lg">
                    {Math.round((weekTasks.filter((t) => t.status === 'Completada').length / weekTasks.length) * 100 || 0)}%
                  </span>
                </div>
              </div>

              {/* BLOQUES DÍA POR DÍA */}
              <div className="space-y-8">
                {weekDays.map((dayLabel) => {
                  const dayTasks = weekTasks.filter((t) => t.day_label === dayLabel);
                  const dayCompleted = dayTasks.filter((t) => t.status === 'Completada').length;

                  return (
                    <div key={dayLabel} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono bg-blue-500/20 text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-500/30">
                            📆 {dayLabel}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {dayCompleted} / {dayTasks.length} subtareas completadas hoy
                          </span>
                        </div>

                        <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-blue-400 h-full transition-all"
                            style={{ width: `${Math.round((dayCompleted / dayTasks.length) * 100 || 0)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* SUBTAREAS DEL DÍA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dayTasks.map((task) => (
                          <DailyTaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={(status) => updateStatus(task.id, status)}
                            onOpenPrompt={() => setSelectedPrompt(task)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </section>

      {/* MODAL DETALLADO CON CRITERIO DE PERFECCIÓN Y PROMPT DE IA */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                    {selectedPrompt.day_label}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedPrompt.assignee}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white">{selectedPrompt.title}</h3>
              </div>
              <button onClick={() => setSelectedPrompt(null)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            {/* CRITERIO DE PERFECCIÓN UNICORNIO */}
            <div className="mb-4 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-purple-300 block font-bold mb-1">
                ⭐ Criterio de Perfección (Objetivo Ideal Unicornio):
              </span>
              <p className="text-xs text-purple-100 leading-relaxed font-mono">{selectedPrompt.ideal_perfection_goal}</p>
            </div>

            {/* PASO A PASO */}
            <div className="mb-4 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-blue-400 block font-bold mb-1">📋 Paso a Paso de Ejecución:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{selectedPrompt.step_by_step}</p>
            </div>

            {/* PROPÓSITO ESTRATÉGICO */}
            <div className="mb-4 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold mb-1">🚀 Propósito Estratégico & Impacto Real:</span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedPrompt.impact_purpose}</p>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Copia este prompt e introdúcelo en <strong>Cursor (`Cmd + K`)</strong> o <strong>Claude 3.5 Sonnet</strong>:
            </p>

            {/* PROMPT DE IA */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-emerald-300 mb-5 whitespace-pre-wrap leading-relaxed">
              {selectedPrompt.ai_rescue_prompt}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedPrompt(null)} className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400">
                Cerrar
              </button>
              <button
                onClick={() => copyToClipboard(selectedPrompt.ai_rescue_prompt)}
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

// TARJETA DE SUBTAREA DIARIA CON CRITERIO DE PERFECCIÓN RESUMIDO
function DailyTaskCard({
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
    <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all ${
      task.status === 'Completada'
        ? 'border-emerald-500/30 bg-emerald-950/10'
        : isJoint
        ? 'border-purple-500/40 bg-purple-950/10'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      <div>
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
          <span className="text-[10px] font-mono text-slate-500">Orden #{task.step_order}</span>
        </div>

        <h4 className={`font-semibold text-sm mb-2 ${task.status === 'Completada' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
          {task.title}
        </h4>

        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{task.description}</p>

        {/* CRITERIO DE PERFECCIÓN RESUMIDO */}
        <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20 mb-3">
          <span className="text-[9px] font-mono uppercase text-purple-300 font-bold block mb-0.5">⭐ Objetivo de Perfección:</span>
          <p className="text-[11px] text-purple-100 leading-tight font-mono">{task.ideal_perfection_goal}</p>
        </div>
      </div>

      {/* CONTROLES Y PROMPT */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
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
          <button onClick={onOpenPrompt} className="text-[11px] text-emerald-400 hover:underline font-mono flex items-center gap-1 font-bold">
            <span>⚡ Prompt IA</span>
          </button>
        )}
      </div>
    </div>
  );
}
