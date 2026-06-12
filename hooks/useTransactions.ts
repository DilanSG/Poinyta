import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Transaction, TransactionType, PeriodPoint } from "../lib/storage/types";
import {
  getTransactions,
  addTransaction as storageAddTransaction,
  updateTransaction as storageUpdateTransaction,
  deleteTransaction as storageDeleteTransaction,
  getMonthlyStats,
  getWeeklyStats,
  getYearlyStats,
  getDailyBreakdownForWeek,
  getWeeklyBreakdownForMonth,
  getMonthlyBreakdownForYear,
  getCategories,
  addCategory as storageAddCategory,
} from "../lib/storage";

// Hook central de finanzas: expone transacciones, estadisticas (semanal,
// mensual, anual), desgloses (diario, semanal, mensual) y categorias.
// Recarga todo via Promise.all en 9 consultas paralelas cada vez que la
// pantalla recibe foco (useFocusEffect).
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [weekStats, setWeekStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [yearStats, setYearStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [weekBreakdown, setWeekBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 7 }, () => ({ income: 0, expenses: 0 }))
  );
  const [monthBreakdown, setMonthBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 4 }, () => ({ income: 0, expenses: 0 }))
  );
  const [yearBreakdown, setYearBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }))
  );
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga simultanea de transacciones, stats y categorias al recibir foco.
  // Promise.all con 9 consultas aprovecha WAL para concurrencia de lecturas.
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      // Promise.all con 9 consultas en paralelo gracias a WAL de SQLite.
      // El tiempo total es el de la consulta mas lenta, no la suma de todas.
      const [
        txData,
        currentStats,
        wStats,
        yStats,
        wBreakdown,
        mBreakdown,
        yBreakdown,
        incCats,
        expCats,
      ] = await Promise.all([
        getTransactions(),
        getMonthlyStats(now.getFullYear(), now.getMonth()),
        getWeeklyStats(),
        getYearlyStats(now.getFullYear()),
        getDailyBreakdownForWeek(),
        getWeeklyBreakdownForMonth(now.getFullYear(), now.getMonth()),
        getMonthlyBreakdownForYear(now.getFullYear()),
        getCategories("income"),
        getCategories("expense"),
      ]);
      setTransactions(txData);
      setStats(currentStats);
      setWeekStats(wStats);
      setYearStats(yStats);
      setWeekBreakdown(wBreakdown);
      setMonthBreakdown(mBreakdown);
      setYearBreakdown(yBreakdown);
      setIncomeCategories(incCats);
      setExpenseCategories(expCats);
    } catch (err: unknown) {
      console.error("useTransactions: error loading data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Inserta transaccion via storage y recarga todos los datos.
  const addTransaction = useCallback(async (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
    await storageAddTransaction(tx);
    await loadData();
  }, [loadData]);

  // Actualiza campos parciales de una transaccion y recarga.
  const updateTransaction = useCallback(async (
    id: string,
    updates: Partial<Pick<Transaction, "type" | "amount" | "description" | "category">>
  ) => {
    await storageUpdateTransaction(id, updates);
    await loadData();
  }, [loadData]);

  // Elimina transaccion por ID y recarga datos en UI.
  const deleteTransaction = useCallback(async (id: string) => {
    await storageDeleteTransaction(id);
    await loadData();
  }, [loadData]);

  // Agrega categoria y actualiza el estado local directamente sin refetch
  // del storage, porque storageAddCategory ya retorna la lista actualizada.
  // Esto evita una consulta SQL extra innecesaria.
  const addCategory = useCallback(async (type: TransactionType, name: string) => {
    const updated = await storageAddCategory(type, name);
    if (type === "income") {
      setIncomeCategories(updated);
    } else {
      setExpenseCategories(updated);
    }
  }, []);

  return {
    transactions,
    stats,
    weekStats,
    monthStats: { ...stats },
    yearStats,
    weekBreakdown,
    monthBreakdown,
    yearBreakdown,
    incomeCategories,
    expenseCategories,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    reload: loadData,
  };
}
