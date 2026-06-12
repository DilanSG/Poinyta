// Modulo de almacenamiento de base de datos para Notificaciones locales in-app.
import { AppNotification, NotificationType } from "./types";

import { getDb } from "./db";
import { generateId } from "./helpers";

type NotificationRow = {
  id: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
};

// Obtiene todas las notificaciones de la base de datos local. Retorna lista ordenada por creacion descendente.
export async function getNotifications(): Promise<AppNotification[]> {
  const db = getDb();
  const rows = await db.getAllAsync<NotificationRow>(
    "SELECT * FROM app_notifications ORDER BY created_at DESC"
  );
  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    type: r.type as NotificationType,
    read: r.read === 1,
    createdAt: r.created_at,
  }));
}

// Anade una nueva notificacion al sistema. Param message: Mensaje del banner. Param type: Severidad/estilo.
// Efecto secundario: purga notificaciones anteriores a PURGE_DAYS dias
// para evitar que la tabla crezca sin limite (ver README §5.6).
export async function addNotification(
  message: string,
  type: NotificationType = "info"
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT INTO app_notifications (id, message, type, read, created_at) VALUES (?, ?, ?, 0, ?)",
    [generateId(), message, type, new Date().toISOString()]
  );
  await deleteOldNotifications(PURGE_DAYS);
}

// Borra notificaciones anteriores a N dias. Se llama desde addNotification
// para mantener acotado el tamaño de la tabla. Param days: Antiguedad en dias.
export async function deleteOldNotifications(days: number): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync("DELETE FROM app_notifications WHERE created_at < ?", cutoff);
}

const PURGE_DAYS = 30;

// Marca una notificacion como leida o procesada. Param id: ID de la notificacion.
export async function markNotificationAsRead(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "UPDATE app_notifications SET read = 1 WHERE id = ?",
    id
  );
}

// Limpia todas las notificaciones leidas.
export async function clearReadNotifications(): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM app_notifications WHERE read = 1");
}
