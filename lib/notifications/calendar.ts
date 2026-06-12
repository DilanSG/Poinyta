import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { Task } from "../storage/types";

const CALENDAR_TITLE = "Poinyta - Tareas";
const CALENDAR_COLOR = "#4C6A92";

// Busca el calendario "Poinyta - Tareas" en el dispositivo. Si no existe,
// lo crea con un source local (Android) o por defecto (iOS). Solicita
// permiso de calendario si es necesario. Retorna el ID del calendario o
// null si no hay permiso o falla la creacion.
async function ensureTaskCalendar(): Promise<string | null> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return null;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    let calendar = calendars.find((c) => c.title === CALENDAR_TITLE);

    if (!calendar) {
      const defaultSource = Platform.OS === "ios"
        ? (await Calendar.getDefaultCalendarAsync()).source
        : { isLocalAccount: true, name: "Poinyta", type: "com.poinyta" };

      const calendarId = await Calendar.createCalendarAsync({
        title: CALENDAR_TITLE,
        color: CALENDAR_COLOR,
        entityType: Calendar.EntityTypes.EVENT,
        source: defaultSource,
        name: "PoinytaTasks",
        ownerAccount: "poinyta",
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      return calendarId;
    }

    return calendar.id;
  } catch {
    return null;
  }
}

// Sincroniza la fecha limite de una tarea al calendario del dispositivo.
// Usa una marca taskId en las notas del evento para identificar actualizaciones,
// en vez de depender del title que el usuario podria editar manualmente.
export async function syncTaskDueDateToCalendar(task: Task): Promise<void> {
  if (!task.dueDate) return;

  const calendarId = await ensureTaskCalendar();
  if (!calendarId) return;

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(23, 59, 0, 0);

  const existing = await Calendar.getEventsAsync(
    [calendarId],
    new Date(dueDate.getTime() - 86400000),
    new Date(dueDate.getTime() + 86400000)
  );
  const existingEvent = existing.find((e) => e.notes?.includes(`taskId:${task.id}`));

  if (existingEvent) {
    await Calendar.updateEventAsync(existingEvent.id, {
      title: `📋 ${task.title}`,
      startDate: dueDate,
      endDate: dueDate,
      notes: `taskId:${task.id}\nPrioridad: ${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}`,
    });
  } else {
    await Calendar.createEventAsync(calendarId, {
      title: `📋 ${task.title}`,
      startDate: dueDate,
      endDate: dueDate,
      notes: `taskId:${task.id}\nPrioridad: ${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}`,
    });
  }
}

// Busca el evento del calendario que contiene la marca taskId y lo elimina.
// El rango de busqueda es generoso (+90d, -365d) para cubrir fechas limite
// pasadas o futuras sin depender de la fecha exacta almacenada.
export async function removeTaskFromCalendar(taskId: string): Promise<void> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendar = calendars.find((c) => c.title === CALENDAR_TITLE);
    if (!calendar) return;

    const events = await Calendar.getEventsAsync(
      [calendar.id],
      new Date(Date.now() - 365 * 86400000),
      new Date(Date.now() + 90 * 86400000)
    );
    const match = events.find((e) => e.notes?.includes(`taskId:${taskId}`));
    if (match) {
      await Calendar.deleteEventAsync(match.id);
    }
  } catch {
    // ignora
  }
}
