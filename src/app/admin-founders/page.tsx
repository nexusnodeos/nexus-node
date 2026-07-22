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

export default function FoundersDashboard() {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cargar las 112 tareas directamente desde Supabase
  const fetchTasks = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('founder_tasks')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // Ordenar tareas por el código (1.1, 1.2, ..., 1.14)
        const sortedTasks = (data as Task[]).sort((a, b) => {
          const numA = parseFloat(a.task_code);
          const numB = parseFloat(b.task_code);
          return numA - numB;
        });
        setTasks(sortedTasks);
      }
    } catch (e) {
      console.error('Error cargando tareas desde Supabase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Listener de Supabase Realtime
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
  const totalProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const weekTasks = currentWeekTasks.length;
  const weekCompleted = currentWeekTasks.filter((t) => t.completed).length;
  const weekProgress = weekTasks > 0 ? Math.round((weekCompleted / weekTasks) * 100) : 0;

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
              <span>👤</span> Rodrigo (CEO)
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

