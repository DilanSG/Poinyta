import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Task, TaskPriority } from "../lib/storage/types";
import {
  getTasks,
  addTask as storageAddTask,
  updateTask as storageUpdateTask,
  toggleTask as storageToggleTask,
  deleteTask as storageDeleteTask,
} from "../lib/storage";

// Hook para gestionar el estado y operaciones CRUD de tareas.
// Recarga automaticamente al recibir foco via useFocusEffect.
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga todas las tareas desde storage. Los errores se tragan
  // para no romper la UI si SQLite falla temporalmente.
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (err: unknown) {
      console.error("useTasks: error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  // Agrega tarea con titulo, prioridad, categoria y fechas opcionales.
  // Retorna el ID generado si el titulo no esta vacio, undefined si se omite.
  const addTask = useCallback(
    async (
      title: string,
      priority?: TaskPriority,
      category?: string,
      dueDate?: string | null,
      reminder?: string | null
    ): Promise<string | undefined> => {
      if (!title.trim()) return;
      const id = await storageAddTask(title, priority, category, dueDate, reminder);
      await fetchTasks();
      return id;
    },
    [fetchTasks]
  );

  // Actualiza campos parciales de una tarea y recarga la lista.
  const updateTask = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        priority?: TaskPriority;
        category?: string;
        dueDate?: string | null;
        reminder?: string | null;
      }
    ) => {
      await storageUpdateTask(id, updates);
      await fetchTasks();
    },
    [fetchTasks]
  );

  // Alterna el estado completado/pendiente de una tarea y recarga.
  const toggleTask = useCallback(
    async (id: string) => {
      await storageToggleTask(id);
      await fetchTasks();
    },
    [fetchTasks]
  );

  // Elimina una tarea por ID y recarga la lista en UI.
  const deleteTask = useCallback(
    async (id: string) => {
      await storageDeleteTask(id);
      await fetchTasks();
    },
    [fetchTasks]
  );

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reload: fetchTasks,
  };
}
