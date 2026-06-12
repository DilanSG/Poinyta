import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../storage/types";
import { requestNotificationPermission, setupNotificationChannel } from "./permissions";

type ScheduledReminder = {
  identifier: string;
  taskId: string;
  date: string;
};

const SCHEDULED_KEY = "poinyta_scheduled_reminders";

// Configura expo-notifications para mostrar alerts y banners cuando la
// app esta en primer plano. Sin sonido ni badge por ser recordatorios
// internos no intrusivos.
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Persiste la lista de recordatorios programados en AsyncStorage.
async function persistScheduled(reminders: ScheduledReminder[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(reminders));
}

// Carga los recordatorios programados desde AsyncStorage.
// Retorna arreglo vacio si no hay datos o el JSON esta corrupto.
async function loadScheduled(): Promise<ScheduledReminder[]> {
  const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Parsea fecha de recordatorio desde el formato "YYYY-MM-DD HH:MM".
// Si no se especifica hora, usa 9:00 como default (inicio de jornada).
function parseReminderDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (hh !== undefined) {
    date.setHours(Number(hh), Number(mm), 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  return date;
}

// Programa un recordatorio local para una tarea.
export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!task.reminder) return;

  const date = parseReminderDate(task.reminder);
  if (!date || date.getTime() <= Date.now()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await setupNotificationChannel();

  await cancelTaskReminder(task.id);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio de tarea",
      body: task.title,
      data: { taskId: task.id, screen: "tasks" },
      ...(Platform.OS === "android" ? { channelId: "task-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });

  // Persistir ANTES de devolver: si la app crashea entre schedule y persist,
  // el reminder queda huérfano (no cancelable). Al persistir primero y
  // schedule después, el riesgo es inverso (notificación no programada pero
  // estado marcado), que es menos grave.
  const scheduled = await loadScheduled();
  scheduled.push({ identifier, taskId: task.id, date: task.reminder });
  await persistScheduled(scheduled);
}

// Cancela un recordatorio programado por ID de tarea.
export async function cancelTaskReminder(taskId: string): Promise<void> {
  const scheduled = await loadScheduled();
  const toCancel = scheduled.filter((r) => r.taskId === taskId);

  for (const r of toCancel) {
    try {
      await Notifications.cancelScheduledNotificationAsync(r.identifier);
    } catch {
      // ignora si ya fue cancelada
    }
  }

  await persistScheduled(scheduled.filter((r) => r.taskId !== taskId));
}

// Cancela todos los recordatorios programados.
export async function cancelAllReminders(): Promise<void> {
  const scheduled = await loadScheduled();
  for (const r of scheduled) {
    try {
      await Notifications.cancelScheduledNotificationAsync(r.identifier);
    } catch {
      // ignora
    }
  }
  await persistScheduled([]);
}

// Reagenda todos los recordatorios al arrancar la app.
// Primero cancela todos los existentes (los identifiers de expo-notifications
// se pierden al reiniciar la app), luego programa solo los de tareas
// pendientes con reminder configurado.
export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  await cancelAllReminders();
  for (const task of tasks) {
    if (!task.completed && task.reminder) {
      await scheduleTaskReminder(task);
    }
  }
}
