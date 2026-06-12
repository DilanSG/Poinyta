import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Canal silencioso para Android — sin sonido, vibracion minima.
// En iOS usamos el canal por defecto.
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Recordatorios de tareas",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
      lightColor: "#4C6A92",
      sound: null,
    });
  }
}

// Pide permiso para notificaciones locales de forma no intrusiva.
// Retorna true si hay permiso.
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}
