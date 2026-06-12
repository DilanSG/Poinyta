import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  getUserName,
  getTasks,
  getNotes,
  getMonthlyStats,
  getWeeklyStats,
  getYearlyStats,
  getDailyBreakdownForWeek,
  getWeeklyBreakdownForMonth,
  getMonthlyBreakdownForYear,
} from "../lib/storage";
import { Task, Note, PeriodPoint } from "../lib/storage/types";

type PeriodStats = { income: number; expenses: number; balance: number };

// Hook principal del dashboard: carga nombre de usuario, tareas pendientes,
// notas recientes, y estadisticas financieras (semanal, mensual, anual con
// desgloses). Promise.all con 9 consultas paralelas aprovecha WAL de SQLite.
export function useHomeData() {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [weekStats, setWeekStats] = useState<PeriodStats>({ income: 0, expenses: 0, balance: 0 });
  const [monthStats, setMonthStats] = useState<PeriodStats>({ income: 0, expenses: 0, balance: 0 });
  const [yearStats, setYearStats] = useState<PeriodStats>({ income: 0, expenses: 0, balance: 0 });
  const [weekBreakdown, setWeekBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 7 }, () => ({ income: 0, expenses: 0 }))
  );
  const [monthBreakdown, setMonthBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 4 }, () => ({ income: 0, expenses: 0 }))
  );
  const [yearBreakdown, setYearBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }))
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();

      // Promise.all dispara 9 consultas en paralelo. SQLite con WAL permite
      // lecturas concurrentes, por lo que el tiempo total es el de la consulta
      // mas lenta (getMonthlyBreakdownForYear) en vez de la suma de todas.
      const [
        name,
        allTasks,
        allNotes,
        wStats,
        mStats,
        yStats,
        wBreakdown,
        mBreakdown,
        yBreakdown,
      ] = await Promise.all([
        getUserName(),
        getTasks(),
        getNotes(),
        getWeeklyStats(),
        getMonthlyStats(now.getFullYear(), now.getMonth()),
        getYearlyStats(now.getFullYear()),
        getDailyBreakdownForWeek(),
        getWeeklyBreakdownForMonth(now.getFullYear(), now.getMonth()),
        getMonthlyBreakdownForYear(now.getFullYear()),
      ]);

      setUserNameState(name);
      setTasks(allTasks.filter((t) => !t.completed).slice(0, 5));
      setNotes(allNotes.slice(0, 2));
      setWeekStats(wStats);
      setMonthStats(mStats);
      setYearStats(yStats);
      setWeekBreakdown(wBreakdown);
      setMonthBreakdown(mBreakdown);
      setYearBreakdown(yBreakdown);
    } catch (err: unknown) {
      console.error("useHomeData: error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return {
    userName,
    tasks,
    notes,
    weekStats,
    monthStats,
    yearStats,
    weekBreakdown,
    monthBreakdown,
    yearBreakdown,
    loading,
    reload: loadData,
  };
}
