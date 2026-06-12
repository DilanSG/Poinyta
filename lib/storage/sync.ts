// Modulo de sincronizacion de datos con n8n y configuracion de URL / API Key.

import * as SecureStore from "expo-secure-store";
import { getDb } from "./db";
import { addTransaction } from "./finance";
import { SYNC_KEY_SECURE } from "./helpers";

// Valida si un hostname pertenece a red privada (RFC 1918) o localhost.
// Esto permite que la app se conecte via HTTP a un bridge en la LAN sin
// exponer la API key en texto plano a traves de internet. Las URLs http://
// con hostnames publicos son rechazadas en normalizeSyncUrl.
// Rangos privados: 10.x.x.x, 192.168.x.x, 172.16-31.x.x, 169.254.x.x
function isPrivateHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;

  const parts = match.slice(1).map((value) => Number(value));
  if (parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;

  return false;
}

// Normaliza y valida una URL de sincronizacion permitida. Param rawUrl: URL cruda. Retorna URL absoluta sin slash final.
function normalizeSyncUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("La URL no puede estar vacía.");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("URL inválida.");
  }

  const isHttps = parsed.protocol === "https:";
  const isLocalHttp = parsed.protocol === "http:" && isPrivateHostname(parsed.hostname);
  if (!isHttps && !isLocalHttp) {
    throw new Error("La URL debe usar https:// (http:// solo en localhost o red local).");
  }

  return parsed.toString().replace(/\/$/, "");
}

// Lee la API key desde almacenamiento seguro del dispositivo. Retorna API key o cadena vacia si no existe.
export async function getSecureSyncKey(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(SYNC_KEY_SECURE)) ?? "";
  } catch {
    return "";
  }
}

// Guarda la API key en almacenamiento seguro. Retorna promesa resuelta cuando la clave queda guardada.
export async function setSecureSyncKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(SYNC_KEY_SECURE, value);
}

// Elimina la API key segura cuando se borra configuracion de sync. Retorna promesa resuelta tras la eliminacion.
export async function deleteSecureSyncKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SYNC_KEY_SECURE);
  } catch {
    // ignora fallos
  }
}

// Obtiene configuracion de sincronizacion desde la tabla settings. Retorna URL y API key vigentes.
export async function getSyncConfig(): Promise<{ url: string; key: string }> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'sync_url'"
  );
  const key = await getSecureSyncKey();
  return { url: row?.value ?? "", key };
}

// Guarda o elimina configuracion de sincronizacion con validaciones.
// Param url: URL base. Param key: API key. Retorna promesa resuelta tras guardado o limpieza.
export async function setSyncConfig(url: string, key: string): Promise<void> {
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  const db = getDb();

  if (!trimmedUrl && !trimmedKey) {
    await db.runAsync("DELETE FROM settings WHERE key = 'sync_url'");
    await deleteSecureSyncKey();
    return;
  }

  if (!trimmedUrl) throw new Error("La URL es requerida.");
  if (!trimmedKey) throw new Error("La API key es requerida.");

  const normalizedUrl = normalizeSyncUrl(trimmedUrl);
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('sync_url', ?)",
    normalizedUrl
  );
  await setSecureSyncKey(trimmedKey);
}

const SYNCED_IDS_KEY = "synced_remote_ids";
const MAX_SYNCED_IDS = 2000;

// Carga los IDs remotos ya procesados desde settings.
// Persistir los IDs en SQLite en vez de solo en memoria permite que
// un crash a mitad del sync no reimporte items ya insertados localmente.
// Se mantienen hasta MAX_SYNCED_IDS para evitar que la fila crezca sin limite.
async function getSyncedIds(): Promise<Set<string>> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?", SYNCED_IDS_KEY
  );
  if (!row) return new Set();
  try {
    const arr = JSON.parse(row.value);
    return new Set<string>(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

// Agrega un ID remoto a la lista de procesados y la persiste.
async function addSyncedId(id: string): Promise<void> {
  const db = getDb();
  const ids = await getSyncedIds();
  ids.add(id);
  if (ids.size > MAX_SYNCED_IDS) {
    const arr = Array.from(ids).slice(-MAX_SYNCED_IDS);
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SYNCED_IDS_KEY, JSON.stringify(arr)]
    );
  } else {
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SYNCED_IDS_KEY, JSON.stringify(Array.from(ids))]
    );
  }
}

const SYNC_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = SYNC_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sincroniza gastos pendientes desde n8n y los marca como procesados.
// Cada item pendiente tiene un `id` unico (UUID v4) generado por el bridge.
// Antes de insertar se verifica si ese `id` ya fue procesado; si es asi,
// se saltea la insercion y solo se elimina del bridge. Esto evita
// duplicados si la app se cierra entre addTransaction y el DELETE.
// Retorna cantidad de registros importados.
export async function syncFromN8n(): Promise<number> {
  const { url, key } = await getSyncConfig();
  if (!url || !key) throw new Error("Configura la URL y la API key primero.");

  const base = normalizeSyncUrl(url);
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const response = await fetchWithTimeout(`${base}/api/expense/pending`, { headers });
  if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

  const pending: {
    id: string;
    amount: number;
    description: string;
    category: string;
    type: string;
    date: string;
  }[] = await response.json();

  const synced = await getSyncedIds();
  let imported = 0;

  for (const item of pending) {
    // Si el ID remoto ya se proceso antes (por un crash entre INSERT y DELETE
    // en una sync anterior), se saltea la insercion local.
    if (!synced.has(item.id)) {
      await addTransaction({
        amount: item.amount,
        description: item.description,
        category: item.category,
        type: item.type === "income" ? "income" : "expense",
      });
      synced.add(item.id);
      imported += 1;
    }
    // DELETE individual por item; si falla, se logea pero no se detiene el sync
    // para evitar que un error de red a mitad de camino bloquee el resto.
    try {
      await fetchWithTimeout(`${base}/api/expense/${item.id}`, { method: "DELETE", headers });
    } catch {
      // ignora errores de DELETE individual — el bridge reenviara items no eliminados
    }
  }

  if (synced.size > 0) {
    const arr = Array.from(synced).slice(-MAX_SYNCED_IDS);
    await getDb().runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SYNCED_IDS_KEY, JSON.stringify(arr)]
    );
  }

  return imported;
}
