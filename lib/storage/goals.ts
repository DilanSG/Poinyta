// Modulo de almacenamiento para Metas secuenciales y su sistema de puntos.
//
// Garantias de esta capa (ver README section6):
// - `awardPoints` se ejecuta como una sola sentencia SQL `UPDATE ... SET value = value + ?`,
//   evitando el patron read-modify-write perdido ante concurrencia.
// - Toda escritura multi-fila (`addGoalStep`, `deleteGoalStep`, `toggleGoalStep`,
//   `completeGoal`) corre dentro de `withExclusiveTransactionAsync`, de modo
//   que un crash a mitad de la operacion se traduce en rollback completo.
// - `completeGoal` usa una transicion condicional `UPDATE ... WHERE status='active'`
//   y otorga puntos solo si la transicion realmente ocurrio.
// - `getGoals` resuelve las metas y sus pasos en un unico `JOIN`, eliminando el
//   N+1 que aparecia en la version anterior.
import { Goal, GoalStep, GoalStatus } from "./types";

import { getDb } from "./db";
import { generateId } from "./helpers";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  created_at: string;
  completed_at: string | null;
  sort_order: number;
};

type StepRow = {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  completed: number;
  step_order: number;
  unlocked_at: string | null;
};

const POINTS_KEY = "user_points";
const STEP_POINTS = 5;
const GOAL_POINTS = 50;

// AwardPoints usa INSERT ... ON CONFLICT DO UPDATE SET value = value + ?
// en vez del patron read-modify-write (getUserPoints + suma + INSERT).
// Esto evita la condicion de carrera donde dos llamadas simultaneas leen
// el mismo valor y escriben la misma suma, perdiendo puntos (ver README §6.1).
// CAST(value AS INTEGER) convierte el TEXT de SQLite a numero entero.
export async function awardPoints(amount: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + ?`,
    [POINTS_KEY, String(amount), amount]
  );
}

// Obtiene los puntos acumulados del usuario. Retorna total de puntos (0 si nunca se asignaron).
export async function getUserPoints(): Promise<number> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    POINTS_KEY
  );
  if (!row) return 0;
  const parsed = parseInt(row.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Devuelve todas las metas con sus pasos ordenados, resueltos en un unico JOIN.
// Reemplaza el N+1 de la version anterior: antes se ejecutaba un SELECT por cada
// meta para traer sus pasos, ahora basta con una sola consulta.
// Retorna lista de metas con `steps` ya armada.
export async function getGoals(): Promise<Goal[]> {
  const db = getDb();

  const goalRows = await db.getAllAsync<GoalRow>(
    "SELECT * FROM goals ORDER BY sort_order ASC, created_at DESC"
  );
  if (goalRows.length === 0) {
    return [];
  }

  const stepRows = await db.getAllAsync<StepRow>(
    "SELECT * FROM goal_steps ORDER BY step_order ASC"
  );

  const stepsByGoal = new Map<string, GoalStep[]>();
  for (const row of stepRows) {
    const list = stepsByGoal.get(row.goal_id) ?? [];
    list.push({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description ?? undefined,
      completed: row.completed === 1,
      stepOrder: row.step_order,
      unlockedAt: row.unlocked_at,
    });
    stepsByGoal.set(row.goal_id, list);
  }

  return goalRows.map((grow) => ({
    id: grow.id,
    title: grow.title,
    description: grow.description ?? undefined,
    status: grow.status as GoalStatus,
    targetDate: grow.target_date ?? undefined,
    createdAt: grow.created_at,
    completedAt: grow.completed_at ?? undefined,
    steps: stepsByGoal.get(grow.id) ?? [],
  }));
}

// Crea una nueva meta sin pasos iniciales. Es una sola insercion, no requiere transaccion.
// Param title: Titulo. Param description: Descripcion opcional. Param targetDate: Fecha objetivo opcional (ISO 8601).
export async function addGoal(
  title: string,
  description?: string,
  targetDate?: string
): Promise<void> {
  const db = getDb();
  const maxRow = await db.getFirstAsync<{ max: number }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS max FROM goals"
  );
  const nextOrder = maxRow?.max ?? 1;
  await db.runAsync(
    "INSERT INTO goals (id, title, description, status, target_date, created_at, sort_order) VALUES (?, ?, ?, 'active', ?, ?, ?)",
    [generateId(), title, description ?? null, targetDate ?? null, new Date().toISOString(), nextOrder]
  );
}

export async function addGoalStep(
  goalId: string,
  title: string,
  insertAfterIndex: number,
  description?: string
): Promise<void> {
  const db = getDb();
  // withExclusiveTransactionAsync asegura que todo el bloque se ejecute
  // como una unica transaccion. Si el dispositivo se apaga a mitad del
  // bucle de INSERTS, SQLite hace rollback y la meta queda en su estado
  // original, sin pasos huerfanos ni ordenes duplicados.
  await db.withExclusiveTransactionAsync(async (txn) => {
    const existing = await txn.getAllAsync<StepRow>(
      "SELECT * FROM goal_steps WHERE goal_id = ? ORDER BY step_order ASC",
      goalId
    );

    const newStep: StepRow = {
      id: generateId(),
      goal_id: goalId,
      title,
      description: description ?? null,
      completed: 0,
      step_order: 0,
      unlocked_at: null,
    };

    const updated: StepRow[] = [...existing];
    // Clamp del indice: no puede ser menor a -1 ni mayor al ultimo paso.
    const safeIndex = Math.max(-1, Math.min(insertAfterIndex, updated.length - 1));
    updated.splice(safeIndex + 1, 0, newStep);

    // UPSERT en vez de DELETE+INSERT: ON CONFLICT(id) actualiza step_order,
    // preservando los valores de completed/unlocked_at de pasos existentes.
    for (let i = 0; i < updated.length; i += 1) {
      await txn.runAsync(
        `INSERT INTO goal_steps (id, goal_id, title, description, completed, step_order, unlocked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           step_order = excluded.step_order`,
        [
          updated[i].id,
          goalId,
          updated[i].title,
          updated[i].description,
          updated[i].completed,
          i + 1,
          updated[i].unlocked_at,
        ]
      );
    }
  });
}

// Elimina un paso incompleto y reordena los restantes. Solo impide eliminar
// pasos ya completados. La operacion corre dentro de una transaccion exclusiva.
// Param stepId: ID del paso. Param goalId: ID de la meta padre.
export async function deleteGoalStep(stepId: string, goalId: string): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const stepRows = await txn.getAllAsync<StepRow>(
      "SELECT * FROM goal_steps WHERE goal_id = ? ORDER BY step_order ASC",
      goalId
    );

    const targetIdx = stepRows.findIndex((s) => s.id === stepId);
    if (targetIdx === -1) return;

    if (stepRows[targetIdx].completed === 1) {
      throw new Error("No puedes eliminar un paso ya completado.");
    }

    await txn.runAsync("DELETE FROM goal_steps WHERE id = ?", stepId);

    const remaining = stepRows.filter((s) => s.id !== stepId);
    for (let i = 0; i < remaining.length; i += 1) {
      await txn.runAsync(
        "UPDATE goal_steps SET step_order = ? WHERE id = ?",
        [i + 1, remaining[i].id]
      );
    }
  });
}

// Alterna el estado completado/pendiente de un paso. Reglas:
// - Para completar: todos los pasos anteriores deben estar completos.
// - Para desmarcar: ningun paso posterior puede estar completo.
// - Al completar por primera vez (cuando `unlocked_at` es null) otorga STEP_POINTS.
//
// Toda la operacion corre dentro de una transaccion exclusiva para que el
// cambio de estado y el incremento de puntos se ejecuten o se deshagan juntos.
// Param stepId: ID del paso. Param goalId: ID de la meta padre.
export async function toggleGoalStep(stepId: string, goalId: string): Promise<void> {
  const db = getDb();
  // Transaccion exclusiva: el cambio de estado del paso, la asignacion de
  // unlocked_at, el incremento de puntos (si aplica) y la reactivacion de
  // la meta (si se desmarca) ocurren como una sola unidad atomica.
  await db.withExclusiveTransactionAsync(async (txn) => {
    const stepRows = await txn.getAllAsync<StepRow>(
      "SELECT * FROM goal_steps WHERE goal_id = ? ORDER BY step_order ASC",
      goalId
    );

    const targetIndex = stepRows.findIndex((s) => s.id === stepId);
    if (targetIndex === -1) return;

    const targetStep = stepRows[targetIndex];

    if (targetStep.completed === 0) {
      // Validacion: no se puede completar un paso si hay anteriores sin completar.
      // Esto fuerza el progreso secuencial de arriba hacia abajo en el mapa mental.
      for (let i = 0; i < targetIndex; i += 1) {
        if (stepRows[i].completed === 0) {
          throw new Error("Completa los pasos anteriores antes de avanzar.");
        }
      }

      // unlocked_at se escribe solo la primera vez (COALESCE con el valor actual).
      // Esto hace que desmarcar y re-marcar un paso no otorgue puntos dos veces.
      const isFirstCompletion = targetStep.unlocked_at === null;
      await txn.runAsync(
        `UPDATE goal_steps
         SET completed = 1, unlocked_at = COALESCE(unlocked_at, ?)
         WHERE id = ?`,
        [new Date().toISOString(), stepId]
      );

      if (isFirstCompletion) {
        await txn.runAsync(
          `INSERT INTO settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + ?`,
          [POINTS_KEY, String(STEP_POINTS), STEP_POINTS]
        );
      }
    } else {
      throw new Error("No puedes desmarcar un paso ya completado.");
    }
  });
}

// Marca una meta como completada y otorga GOAL_POINTS una sola vez.
//
// Cambios respecto a la version anterior:
// - La transicion de estado usa `UPDATE ... WHERE status = 'active'` y se
//   inspecciona el `changes()` resultante; si es 0, la meta ya estaba
//   completada y no se otorgan puntos.
// - El incremento de puntos se hace con la misma sentencia atomica de
//   `awardPoints`, dentro del flujo de la operacion.
// Param goalId: ID de la meta. Retorna true si paso de activa a completada.
export async function completeGoal(goalId: string): Promise<boolean> {
  const db = getDb();

  const stepRows = await db.getAllAsync<StepRow>(
    "SELECT * FROM goal_steps WHERE goal_id = ?",
    goalId
  );
  const allDone =
    stepRows.length === 0 || stepRows.every((s) => s.completed === 1);
  if (!allDone) {
    throw new Error("Completa todos los pasos antes de finalizar la meta.");
  }

  // Transicion condicional: solo actualiza si la meta esta 'active'.
  // Si dos llamadas concurrentes ejecutan completeGoal, solo la primera
  // vera changes > 0 y recibira los puntos. La segunda encuentra status
  // = 'completed' y changes = 0, por lo que awardPoints no se ejecuta.
  const result = await db.runAsync(
    "UPDATE goals SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'active'",
    [new Date().toISOString(), goalId]
  );

  const transitioned = (result.changes ?? 0) > 0;
  if (transitioned) {
    await awardPoints(GOAL_POINTS);
  }
  return transitioned;
}

// Elimina una meta y todos sus pasos asociados. El `ON DELETE CASCADE` en
// `goal_steps.goal_id` se aprovecha para borrar en una sola sentencia; si
// el esquema actual no tuviera la FK, el `DELETE FROM goal_steps` previo
// cubre ese caso. Aqui se hace explicito por defensa.
// Param goalId: ID de la meta a eliminar.
// Actualiza el título y/o descripción de una meta existente.
export async function updateGoal(
  id: string,
  updates: { title?: string; description?: string }
): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (updates.title !== undefined) { sets.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description); }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE goals SET ${sets.join(", ")} WHERE id = ?`, values);
}

// Reordena las metas segun el orden de los IDs en el array.
// Cada meta recibe un sort_order basado en su posicion en `orderedIds`.
export async function reorderGoals(orderedIds: string[]): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await txn.runAsync(
        "UPDATE goals SET sort_order = ? WHERE id = ?",
        [i + 1, orderedIds[i]]
      );
    }
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("DELETE FROM goal_steps WHERE goal_id = ?", goalId);
    await txn.runAsync("DELETE FROM goals WHERE id = ?", goalId);
  });
}
