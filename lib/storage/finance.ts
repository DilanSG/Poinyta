// Modulo de almacenamiento para transacciones financieras y categorias.
import { Transaction, TransactionType, PeriodPoint } from "./types";

import { getDb } from "./db";
import { generateId, normalizeCategory } from "./helpers";
import { addNotification } from "./notifications";

type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
};

// Mapea una fila de SQLite al tipo Transaction. Param row: Fila cruda. Retorna Transaction tipado.
function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: row.amount,
    description: row.description,
    category: row.category,
    date: row.date,
  };
}

// Deduplica categorias de forma case-insensitive preservando el orden original. Retorna lista unica y normalizada.
function uniqueCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of categories) {
    const normalized = normalizeCategory(item);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

// Lista todos los movimientos financieros persistidos, del mas reciente al mas antiguo. Retorna arreglo ordenado descendente.
export async function getTransactions(): Promise<Transaction[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
  return rows.map(rowToTransaction);
}

// Agrega un movimiento nuevo con ID y fecha generados automaticamente. Retorna promesa resuelta al guardar.
export async function addTransaction(
  tx: Omit<Transaction, "id" | "date"> & { date?: string }
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT INTO transactions (id, type, amount, description, category, date) VALUES (?, ?, ?, ?, ?, ?)",
    [generateId(), tx.type, tx.amount, tx.description, tx.category, tx.date ?? new Date().toISOString()]
  );
}

// Elimina un movimiento por su identificador. Retorna promesa resuelta tras la eliminacion.
export async function deleteTransaction(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
}

// Calcula ingresos, gastos y balance para un mes calendario mediante SQL agregado. Param year: Anio. Param month: Mes (0-11). Retorna totales del mes.
export async function getMonthlyStats(
  year: number,
  month: number
): Promise<{ income: number; expenses: number; balance: number }> {
  const db = getDb();
  const monthStr = String(month + 1).padStart(2, "0");
  const yearStr = String(year);

  const row = await db.getFirstAsync<{ income: number; expenses: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?`,
    [yearStr, monthStr]
  );

  const income = row?.income ?? 0;
  const expenses = row?.expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}

// Devuelve las ultimas transacciones para bloques resumidos. Param limit: Cantidad maxima. Retorna subconjunto ordenado descendente.
export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions ORDER BY date DESC LIMIT ?",
    limit
  );
  return rows.map(rowToTransaction);
}

// Obtiene categorias guardadas para un tipo de movimiento. Retorna lista ordenada por insercion.
export async function getCategories(type: TransactionType): Promise<string[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM categories WHERE type = ? ORDER BY id ASC",
    type
  );
  return rows.map((r) => r.name);
}

// Reemplaza todas las categorias de un tipo: DELETE + INSERT en una sola
// transaccion exclusiva para que no queden datos parciales si la app
// crashea entre la eliminacion y la insercion.
export async function setCategoriesForType(
  type: TransactionType,
  categories: string[]
): Promise<void> {
  const db = getDb();
  const cleaned = uniqueCategories(categories);
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("DELETE FROM categories WHERE type = ?", type);
    for (const name of cleaned) {
      await txn.runAsync(
        "INSERT OR IGNORE INTO categories (type, name) VALUES (?, ?)",
        [type, name]
      );
    }
  });
}

// Calcula ingresos, gastos y balance para la semana actual (lunes a domingo).
// La semana arranca en lunes usando la formula (day+6)%7 para re-mapear
// getDay() (0=Dom) a indice local (0=Lun). Retorna totales de la semana.
export async function getWeeklyStats(): Promise<{ income: number; expenses: number; balance: number }> {
  const db = getDb();
  const now = new Date();
  // getDay() devuelve 0=Dom, 1=Lun... La formula (day+6)%7 transforma
  // domingo (0) → 6 y lunes (1) → 0, para que la semana arranque en lunes.
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const row = await db.getFirstAsync<{ income: number; expenses: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE date >= ? AND date <= ?`,
    [monday.toISOString(), sunday.toISOString()]
  );
  const income = row?.income ?? 0;
  const expenses = row?.expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}

// Calcula ingresos, gastos y balance para el anio calendario indicado. Retorna totales del anio.
export async function getYearlyStats(year: number): Promise<{ income: number; expenses: number; balance: number }> {
  const db = getDb();
  const row = await db.getFirstAsync<{ income: number; expenses: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE strftime('%Y', date) = ?`,
    [String(year)]
  );
  const income = row?.income ?? 0;
  const expenses = row?.expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}

// Devuelve el desglose diario de ingresos y gastos para la semana actual (lun-dom).
// Indice 0 = lunes, indice 6 = domingo. Los dias sin movimientos devuelven { income: 0, expenses: 0 }.
// Retorna arreglo de 7 puntos ordenados de lunes a domingo.
export async function getDailyBreakdownForWeek(): Promise<PeriodPoint[]> {
  const db = getDb();
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const rows = await db.getAllAsync<{ day: string; income: number; expenses: number }>(
    `SELECT date(date) as day,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY date(date)
     ORDER BY date(date) ASC`,
    [monday.toISOString(), sunday.toISOString()]
  );

  // Arreglo fijo de 7 dias (lun-dom), inicializado con ceros.
  // Los dias sin movimientos se quedan en 0 en lugar de ser omitidos,
  // asi el grafico de linea semanal siempre muestra 7 puntos consistentes.
  const result: PeriodPoint[] = Array.from({ length: 7 }, () => ({ income: 0, expenses: 0 }));
  for (const row of rows) {
    const d = new Date(row.day + "T00:00:00Z");
    // Re-mapeo de getUTCDay (0=Dom) a indice local (0=Lun).
    // row.day viene de SQLite date() que siempre retorna ISO (YYYY-MM-DD), segura para Date.
    const idx = (d.getUTCDay() + 6) % 7;
    result[idx] = { income: row.income, expenses: row.expenses };
  }
  return result;
}
export async function getWeeklyStatsForWeek(
  monday: Date
): Promise<{ income: number; expenses: number; balance: number }> {
  const db = getDb();
  const start = new Date(monday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const row = await db.getFirstAsync<{ income: number; expenses: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE date >= ? AND date <= ?`,
    [start.toISOString(), end.toISOString()]
  );
  const income = row?.income ?? 0;
  const expenses = row?.expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}

// Devuelve el desglose diario de ingresos y gastos para la semana que inicia en el lunes indicado.
// Param monday: Fecha del lunes. Retorna arreglo de 7 puntos (indice 0=lunes, 6=domingo).
export async function getDailyBreakdownForWeekDate(monday: Date): Promise<PeriodPoint[]> {
  const db = getDb();
  const start = new Date(monday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const rows = await db.getAllAsync<{ day: string; income: number; expenses: number }>(
    `SELECT date(date) as day,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY date(date)
     ORDER BY date(date) ASC`,
    [start.toISOString(), end.toISOString()]
  );

  const result: PeriodPoint[] = Array.from({ length: 7 }, () => ({ income: 0, expenses: 0 }));
  for (const row of rows) {
    const d = new Date(row.day + "T00:00:00Z");
    // row.day es ISO desde SQLite date(), seguro para parsear con Date.
    const idx = (d.getUTCDay() + 6) % 7;
    result[idx] = { income: row.income, expenses: row.expenses };
  }
  return result;
}

// Devuelve el desglose semanal de ingresos y gastos para el mes indicado (4 semanas).
// Semana 1 = dias 1-7, semana 2 = 8-14, semana 3 = 15-21, semana 4 = 22-fin.
// Param year: Anio. Param month: Mes (0-11). Retorna arreglo de 4 puntos.
export async function getWeeklyBreakdownForMonth(year: number, month: number): Promise<PeriodPoint[]> {
  const db = getDb();
  const monthStr = String(month + 1).padStart(2, "0");
  const yearStr = String(year);

  const rows = await db.getAllAsync<{ week: number; income: number; expenses: number }>(
    `SELECT week_of_month as week,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
     FROM (
       SELECT type, amount,
         CASE
           WHEN CAST(strftime('%d', date) AS INTEGER) <= 7  THEN 1
           WHEN CAST(strftime('%d', date) AS INTEGER) <= 14 THEN 2
           WHEN CAST(strftime('%d', date) AS INTEGER) <= 21 THEN 3
           ELSE 4
         END as week_of_month
       FROM transactions
       WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
     )
     GROUP BY week_of_month
     ORDER BY week_of_month ASC`,
    [yearStr, monthStr]
  );

  const result: PeriodPoint[] = Array.from({ length: 4 }, () => ({ income: 0, expenses: 0 }));
  for (const row of rows) {
    const idx = row.week - 1;
    if (idx >= 0 && idx < 4) result[idx] = { income: row.income, expenses: row.expenses };
  }
  return result;
}

// Devuelve el desglose mensual de ingresos y gastos para el anio indicado (12 meses).
// Indice 0 = enero, indice 11 = diciembre. Los meses sin movimientos devuelven { income: 0, expenses: 0 }.
// Retorna arreglo de 12 puntos.
export async function getMonthlyBreakdownForYear(year: number): Promise<PeriodPoint[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{ month: number; income: number; expenses: number }>(
    `SELECT CAST(strftime('%m', date) AS INTEGER) as month,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
     FROM transactions
     WHERE strftime('%Y', date) = ?
     GROUP BY month
     ORDER BY month ASC`,
    [String(year)]
  );

  const result: PeriodPoint[] = Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }));
  for (const row of rows) {
    const idx = row.month - 1;
    if (idx >= 0 && idx < 12) result[idx] = { income: row.income, expenses: row.expenses };
  }
  return result;
}

// Agrega una categoria nueva si no existe para el tipo indicado. Retorna coleccion final de categorias.
export async function addCategory(
  type: TransactionType,
  name: string
): Promise<string[]> {
  const normalized = normalizeCategory(name);
  if (!normalized) return getCategories(type);
  const db = getDb();
  await db.runAsync(
    "INSERT OR IGNORE INTO categories (type, name) VALUES (?, ?)",
    [type, normalized]
  );
  return getCategories(type);
}

// Inserta multiples transacciones en una sola transaccion atomica.
// Si la app crashea a mitad de la insercion, ninguna transaccion queda
// persistida parcialmente. Param txs: Arreglo de movimientos sin ID/fecha.
export async function addTransactionsBatch(
  txs: (Omit<Transaction, "id" | "date"> & { date?: string })[]
): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const tx of txs) {
      await txn.runAsync(
        "INSERT INTO transactions (id, type, amount, description, category, date) VALUES (?, ?, ?, ?, ?, ?)",
        [generateId(), tx.type, tx.amount, tx.description, tx.category, tx.date ?? new Date().toISOString()]
      );
    }
  });
  if (txs.length > 0) {
    await addNotification(`${txs.length} movimientos importados desde SMS`, "info");
  }
}

// Actualiza los campos editables de un movimiento existente. Retorna promesa resuelta tras la actualizacion.
export async function updateTransaction(
  id: string,
  updates: Partial<Pick<Transaction, "type" | "amount" | "description" | "category" | "date">>
): Promise<void> {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.type !== undefined) { fields.push("type = ?"); values.push(updates.type); }
  if (updates.amount !== undefined) { fields.push("amount = ?"); values.push(updates.amount); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
  if (updates.date !== undefined) { fields.push("date = ?"); values.push(updates.date); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`, values);
}
