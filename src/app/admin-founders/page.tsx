"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase con tus variables locales de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Task = {
  id: string;
  week: number;
  day: number;
  assignee: string;
  title: string;
  description: string;
  prompt: string;
  is_completed: boolean;
};

export default function ProgressDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("nexus_tasks")
      .select("*")
      .order("week", { ascending: true })
      .order("day", { ascending: true });

    if (error) console.error("Error cargando tareas:", error);
    else setTasks(data || []);
    setLoading(false);
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("nexus_tasks")
      .update({ is_completed: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error actualizando tarea:", error);
    } else {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cálculos globales y semanales
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const monthlyProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const weekTasks = tasks.filter(t => t.week === selectedWeek);
  const completedWeekTasks = weekTasks.filter(t => t.is_completed).length;
  const weeklyProgress = weekTasks.length === 0 ? 0 : Math.round((completedWeekTasks / weekTasks.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-xl font-mono animate-pulse">Cargando Plataforma Nexus...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <header className="mb-8 border-b border-gray-800 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">
                Nexus: Dashboard de Progreso
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Meta: Prueba Piloto operando al 100% en 30 días.
              </p>
            </div>
            <button 
              onClick={fetchTasks}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-mono rounded border border-gray-700 transition"
            >
              🔄 Sincronizar Supabase
            </button>
          </div>
        </header>

        {/* Barras de Progreso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-300">Progreso Total (30 Días)</span>
              <span className="text-sm font-mono text-blue-400 font-bold">{monthlyProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500" 
                style={{ width: `${monthlyProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-300">Progreso Semana {selectedWeek}</span>
              <span className="text-sm font-mono text-green-400 font-bold">{weeklyProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navegador de Semanas */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedWeek === w
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
              }`}
            >
              Semana {w}
            </button>
          ))}
        </div>

        {/* Grid de Columnas por Responsable */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna Tú */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
              <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                👤 Tus Tareas (Estrategia y Prompts)
              </h2>
              <span className="text-xs bg-blue-950 text-blue-300 px-2.5 py-1 rounded-full font-mono border border-blue-800">
                {weekTasks.filter(t => t.assignee === 'Tú' && t.is_completed).length} / {weekTasks.filter(t => t.assignee === 'Tú').length}
              </span>
            </div>
            <div className="space-y-4">
              {weekTasks.filter(t => t.assignee === 'Tú').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTask(task.id, task.is_completed)} 
                  onCopy={copyToClipboard}
                  isCopied={copiedId === task.id}
                />
              ))}
            </div>
          </div>

          {/* Columna Federico */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
              <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                💻 Federico (Desarrollo e Infraestructura)
              </h2>
              <span className="text-xs bg-green-950 text-green-300 px-2.5 py-1 rounded-full font-mono border border-green-800">
                {weekTasks.filter(t => t.assignee === 'Federico' && t.is_completed).length} / {weekTasks.filter(t => t.assignee === 'Federico').length}
              </span>
            </div>
            <div className="space-y-4">
              {weekTasks.filter(t => t.assignee === 'Federico').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTask(task.id, task.is_completed)} 
                  onCopy={copyToClipboard}
                  isCopied={copiedId === task.id}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente para renderizar la tarjeta de cada tarea
function TaskCard({ 
  task, 
  onToggle, 
  onCopy, 
  isCopied 
}: { 
  task: Task; 
  onToggle: () => void; 
  onCopy: (text: string, id: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl border transition-all ${
      task.is_completed 
        ? "bg-gray-900/40 border-green-900/40 opacity-70" 
        : "bg-gray-900 border-gray-800 hover:border-gray-700 shadow-md"
    }`}>
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className={`font-bold text-base ${task.is_completed ? "line-through text-gray-500" : "text-gray-100"}`}>
          {task.title}
        </h3>
        <button 
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            task.is_completed 
              ? "bg-green-950 text-green-400 border border-green-800 hover:bg-green-900" 
              : "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
          }`}
        >
          {task.is_completed ? "✓ Hecho" : "Marcar listo"}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-4 leading-relaxed">{task.description}</p>

      {task.prompt && !task.is_completed && (
        <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs font-mono relative group">
          <div className="flex justify-between items-center mb-1 text-gray-500">
            <span>// Prompt de trabajo:</span>
            <button 
              onClick={() => onCopy(task.prompt, task.id)}
              className="text-blue-400 hover:text-blue-300 font-sans text-xs underline"
            >
              {isCopied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-gray-300 line-clamp-3 select-all">{task.prompt}</p>
        </div>
      )}
    </div>
  );
}
