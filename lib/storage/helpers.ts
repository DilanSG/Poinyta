import { getDb } from "./db";
import * as SecureStore from "expo-secure-store";

export const SYNC_KEY_SECURE = "poinyta_sync_key_secure";

// Contador monotonico por proceso que se incrementa en cada llamada a
// generateId(). Esto reduce drasticamente la ventana de colision cuando
// se insertan varios registros en el mismo milisegundo (ej. al sync).
// >>> 0 fuerza el resultado a unsigned int32, evitando desbordes negativos.
let idCounter = 0;

// Normaliza el nombre de una categoria: recorta espacios externos y colapsa
// whitespace multiple interno a un solo espacio. Esto evita duplicados como
// "Comida " y "Comida" siendo tratados como categorias diferentes.
export function normalizeCategory(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// Genera un ID unico en formato base36: timestamp + contador monotono + 12
// caracteres aleatorios. El contador por proceso reduce la ventana de colision
// cuando se insertan varios registros en el mismo milisegundo (ej. sync).
export function generateId(): string {
  idCounter = (idCounter + 1) >>> 0;
  const time = Date.now().toString(36);
  const count = idCounter.toString(36).padStart(2, "0");
  // Dos segmentos aleatorios base36 de 6 caracteres cada uno, lo que da
  // aproximadamente 36^12 ≈ 4.7e18 combinaciones posibles por milisegundo.
  const r1 = Math.random().toString(36).slice(2, 8);
  const r2 = Math.random().toString(36).slice(2, 8);
  return `${time}-${count}-${r1}${r2}`;
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  // Borra todas las tablas de datos, pero NO resetea el schema.
  // Los contadores y settings se pierden; la sync_key en SecureStore
  // tambien se elimina para que el sync quede desconfigurado.
  await db.execAsync(`
    DELETE FROM tasks;
    DELETE FROM notes;
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM wish_items;
    DELETE FROM settings;
  `);
  try {
    await SecureStore.deleteItemAsync(SYNC_KEY_SECURE);
  } catch {
    // SecureStore puede lanzar en dispositivos sin backend seguro
    // (ej. algunos emuladores). Se ignora silenciosamente.
  }
}
