import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Goal } from "../lib/storage/types";
import {
  getGoals,
  addGoal,
  addGoalStep,
  deleteGoalStep,
  toggleGoalStep,
  completeGoal,
  deleteGoal as storageDeleteGoal,
  getUserPoints,
  reorderGoals as storageReorderGoals,
  updateGoal as storageUpdateGoal,
} from "../lib/storage";

// Hook para manejar el estado y la lógica de negocio de las Metas.
// Incluye el sistema de puntos del usuario. Retorna estado y funciones de interacción de Metas.
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, pts] = await Promise.all([getGoals(), getUserPoints()]);
      setGoals(data);
      setUserPoints(pts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar las metas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  // Crea una nueva meta sin pasos iniciales.
  const createGoal = async (title: string, description?: string, targetDate?: string) => {
    await addGoal(title, description, targetDate);
    await loadGoals();
  };

  // Agrega un paso intermedio a una meta en la posición indicada.
  const addStepToGoal = async (
    goalId: string,
    title: string,
    insertAfterIndex: number,
    description?: string
  ) => {
    await addGoalStep(goalId, title, insertAfterIndex, description);
    await loadGoals();
  };

  // Elimina un paso de una meta.
  const removeStep = async (stepId: string, goalId: string) => {
    await deleteGoalStep(stepId, goalId);
    await loadGoals();
  };

  // Alterna el estado de un paso. Otorga 5 pts en la primera compleción.
  const toggleStep = async (stepId: string, goalId: string) => {
    try {
      setError(null);
      await toggleGoalStep(stepId, goalId);
      await loadGoals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transición de paso inválida.");
      throw err;
    }
  };

  // Finaliza una meta. Devuelve `true` si la transición fue efectiva
  // (es decir, la meta pasó de activa a completada y se otorgaron 50 pts).
  const finalizeGoal = async (goalId: string): Promise<boolean> => {
    try {
      setError(null);
      const transitioned = await completeGoal(goalId);
      await loadGoals();
      return transitioned;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo completar la meta.");
      throw err;
    }
  };

  // Reordena las metas. `orderedIds` debe contener todos los IDs en el nuevo orden.
  const reorderGoals = async (orderedIds: string[]) => {
    await storageReorderGoals(orderedIds);
    await loadGoals();
  };

  // Elimina una meta y todos sus pasos.
  const deleteGoalId = async (goalId: string) => {
    await storageDeleteGoal(goalId);
    await loadGoals();
  };

  // Actualiza el título y/o descripción de una meta.
  const updateGoal = async (id: string, updates: { title?: string; description?: string }) => {
    await storageUpdateGoal(id, updates);
    await loadGoals();
  };

  return {
    goals,
    userPoints,
    isLoading,
    error,
    setError,
    loadGoals,
    createGoal,
    addStepToGoal,
    removeStep,
    toggleStep,
    finalizeGoal,
    deleteGoalId,
    reorderGoals,
    updateGoal,
  };
}
