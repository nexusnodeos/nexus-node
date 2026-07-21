"use client";

import React, { useState } from "react";
import { 
  Calendar, CheckCircle2, Circle, User, ShieldCheck, 
  TrendingUp, ArrowRight, BarChart3, ChevronRight, Award
} from "lucide-react";

// Tipos de datos
interface Task {
  id: string;
  phase: number;
  week: number;
  dayName: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  title: string;
  description: string;
  assignee: "Rodrigo" | "Federico" | "Ambos";
  completed: boolean;
}

export default function CalendarDashboard() {
  // Estados para Navegación Interactiva
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>("Lunes");

  // Estado de Tareas de Muestra (Sincronizable con Supabase)
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", phase: 1, week: 1, dayName: "Lunes", title: "Diseño del Esquema SQL Relacional", description: "Crear tablas en Supabase con RLS.", assignee: "Rodrigo", completed: true },
    { id: "2", phase: 1, week: 1, dayName: "Lunes", title: "Definición del ICP Minero", description: "Filtros para 50 mineras de Cobre/Oro.", assignee: "Federico", completed: true },
    { id: "3", phase: 1, week: 1, dayName: "Martes", title: "Scraping Catastro Minero", description: "Extracción de títulos activos de la ANM/SGM.", assignee: "Federico", completed: true },
    { id: "4", phase: 1, week: 1, dayName: "Martes", title: "API Route de Ingesta de Leads", description: "Endpoint Next.js para carga masiva de CSV.", assignee: "Rodrigo", completed: false },
    { id: "5", phase: 1, week: 1, dayName: "Miércoles", title: "Setup Dominio & Resend API", description: "Configuración de SPF, DKIM y DMARC.", assignee: "Rodrigo", completed: false },
    { id: "6", phase: 1, week: 1, dayName: "Miércoles", title: "Redacción Copy Email Outbound", description: "Copy enfocado en cobro en 48 hrs.", assignee: "Federico", completed: false },
    { id: "7", phase: 1, week: 1, dayName: "Jueves", title: "Lanzamiento de Campaña Outbound", description: "Envío masivo a 50 mineras objetivo.", assignee: "Ambos", completed: false },
    { id: "8", phase: 1, week: 1, dayName: "Viernes", title: "Llamadas de Refuerzo & Cierre", description: "Agendamiento de demos para Semana 2.", assignee: "Federico", completed: false },
    // Fase 2 Sample
    { id: "9", phase: 2, week: 5, dayName: "Lunes", title: "Constitución de Entidad Escrow", description: "Revisión legal de contratos de custodia.", assignee: "Federico", completed: false },
    { id: "10", phase: 2, week: 5, dayName: "Lunes", title: "Integración API Bancaria KYB", description: "Conectar validación automática de identidad.", assignee: "Rodrigo", completed: false },
  ]);

  // Alternar Estado de Completado
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Filtrado de Tareas
  const currentWeekTasks = tasks.filter(t => t.phase === selectedPhase && t.week === selectedWeek);
  const currentDayTasks = currentWeekTasks.filter(t => t.dayName === selectedDay);

  // Cálculo de Progresos Semanales
  const rodrigoTasks = currentWeekTasks.filter(t => t.assignee === "Rodrigo" || t.assignee === "Ambos");
  const federicoTasks = currentWeekTasks.filter(t => t.assignee === "Federico" || t.assignee === "Ambos");

  const rodrigoDone = rodrigoTasks.filter(t => t.completed).length;
  const federicoDone = federicoTasks.filter(t => t.completed).length;
  const totalDone = currentWeekTasks.filter(t => t.completed).length;

  const rodrigoPercent = rodrigoTasks.length ? Math.round((rodrigoDone / rodrigoTasks.length) * 100) : 0;
  const federicoPercent = federicoTasks.length ? Math.round((federicoDone / federicoTasks.length) * 100) : 0;
  const overallPercent = currentWeekTasks.length ? Math.round((totalDone / currentWeekTasks.length) * 100) : 0;

  const days: Task["dayName"][] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Calendar className="text-emerald-400 w-8 h-8" />
            NEXUS NODE — Dashboard Operativo
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Navegación de Fases, Semanas y Ejecución Diaria de Fundadores.
          </p>
        </div>
        
        {/* NAVEGACIÓN DE FASES */}
        <div className="flex gap-2 mt-4 md:mt-0 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[1, 2, 3, 4].map((phaseNum) => (
            <button
              key={phaseNum}
              onClick={() => {
                setSelectedPhase(phaseNum);
                setSelectedWeek(phaseNum === 1 ? 1 : phaseNum === 2 ? 5 : phaseNum === 3 ? 9 : 13);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPhase === phaseNum 
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Fase {phaseNum}
            </button>
          ))}
        </div>
      </div>

      {/* NAVEGADOR DE SEMANAS DE LA FASE */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semana:</span>
        {Array.from({ length: 4 }, (_, i) => {
          const weekNum = (selectedPhase - 1) * 4 + (i + 1);
          return (
            <button
              key={weekNum}
              onClick={() => setSelectedWeek(weekNum)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedWeek === weekNum
                  ? "bg-slate-800 border-emerald-500 text-emerald-400 font-bold"
                  : "border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Semana {weekNum}
            </button>
          );
        })}
      </div>

      {/* BARRAS DE PROGRESO DE LOS FUNDADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Progreso Rodrigo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold flex items-center gap-2 text-blue-400">
              <User className="w-4 h-4" /> Rodrigo (CEO & Tech)
            </span>
            <span className="text-lg font-bold text-white">{rodrigoPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${rodrigoPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{rodrigoDone} de {rodrigoTasks.length} tareas semanales listadas</p>
        </div>

        {/* Progreso Federico */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold flex items-center gap-2 text-purple-400">
              <User className="w-4 h-4" /> Federico (COO)
            </span>
            <span className="text-lg font-bold text-white">{federicoPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${federicoPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{federicoDone} de {federicoTasks.length} tareas semanales listadas</p>
        </div>

        {/* Progreso General Semanal */}
        <div className="bg-slate-900 border border-emerald-900/50 bg-gradient-to-br from-slate-900 to-emerald-950/20 rounded-xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <BarChart3 className="w-4 h-4" /> Progreso General Semanal
            </span>
            <span className="text-lg font-bold text-emerald-400">{overallPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500" 
              style={{ width: `${overallPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{totalDone} de {currentWeekTasks.length} tareas totales completadas</p>
        </div>

      </div>

      {/* PESTAÑAS DE DÍAS DE LA SEMANA (CALENDARIO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex border-b border-slate-800 pb-4 mb-6 overflow-x-auto gap-2">
          {days.map((day) => {
            const dayTaskCount = currentWeekTasks.filter(t => t.dayName === day).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedDay === day
                    ? "bg-slate-800 text-white font-bold border border-slate-700 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <span>{day}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedDay === day ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {dayTaskCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* LISTA DE TAREAS DEL DÍA SELECCIONADO */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            Tareas de {selectedDay} — Fase {selectedPhase} (Semana {selectedWeek})
          </h2>

          {currentDayTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No hay tareas agendadas para este día en la Semana {selectedWeek}.
            </div>
          ) : (
            currentDayTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                  task.completed 
                    ? "bg-slate-950/50 border-slate-800/80 opacity-75" 
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button className="mt-1 text-slate-400 hover:text-emerald-400">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <div>
                    <h3 className={`font-semibold text-sm ${task.completed ? "line-through text-slate-500" : "text-white"}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  </div>
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border whitespace-nowrap ${
                  task.assignee === "Rodrigo" ? "bg-blue-950/40 border-blue-800/50 text-blue-400" :
                  task.assignee === "Federico" ? "bg-purple-950/40 border-purple-800/50 text-purple-400" :
                  "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
                }`}>
                  {task.assignee}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* REPORTE EJECUTIVO DE CIERRE DE SEMANA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Reporte Ejecutivo de Cierre de Semana {selectedWeek}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> ¿Dónde estamos parados?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Fase {selectedPhase} en ejecución fluida. Base técnica consolidada en Supabase y motor outbound activo enviando la propuesta de custodia digital a mineras calificadas.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> ¿Qué logramos esta semana?
            </h4>
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              <li>100% de la infraestructura SQL y seguridad RLS desplegada.</li>
              <li>50 Leads de mineras de Cobre/Oro verificados en base de datos.</li>
              <li>Integración de envíos por Resend API con autenticación DKIM/SPF.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-400" /> ¿Qué sigue la próxima semana?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ejecutar las reuniones comerciales agendadas, presentar la Hoja de Términos (Term Sheet) de 1 página y cerrar el primer contrato piloto para el flujo de custodia.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-amber-400" /> Visión Estratégica & Roadmap
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Mantener el ritmo acelerado para alcanzar $100k+ USD GMV en la Fase 1 y escalar a $1M USD GMV en la Fase 3 con procesos automatizados.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
