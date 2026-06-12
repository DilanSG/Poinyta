import { getDb } from "./db";

const ACTIVE_KEY = "active_movement_layer";

// Lee la capa de movimiento activa desde settings. Retorna "none" como
// default si no hay configuracion previa o la clave no existe.
export async function getActiveMovementLayer(): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    ACTIVE_KEY
  );
  return row?.value ?? "none";
}

// Persiste el ID de la capa de movimiento activa. Sobrescribe el valor
// anterior con INSERT OR REPLACE.
export async function setActiveMovementLayer(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ACTIVE_KEY,
    id
  );
}

// Obtiene el Set de IDs de capas de movimiento compradas. Siempre incluye
// "none" como item gratuito base. Retorna solo {"none"} si no hay datos.
export async function getPurchasedMovementLayerIds(): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'purchased_movement_layers'"
  );
  if (!rows.length) return new Set(["none"]);
  try {
    const ids: string[] = JSON.parse(rows[0].value);
    return new Set(["none", ...ids]);
  } catch {
    return new Set(["none"]);
  }
}

// Compra una capa de movimiento: verifica puntos, deduce el costo y agrega
// el ID a la lista de comprados, todo en una transaccion exclusiva.
export async function purchaseMovementLayer(
  id: string,
  cost: number
): Promise<{ success: boolean; reason?: string }> {
  const db = getDb();
  try {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const row = await txn.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'user_points'"
      );
      const points = parseInt(row?.value ?? "0", 10);
      if (points < cost) {
        throw new Error("Puntos insuficientes");
      }

      await txn.runAsync(
        "UPDATE settings SET value = CAST(value AS INTEGER) - ? WHERE key = 'user_points'",
        cost
      );

      const existing = await txn.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'purchased_movement_layers'"
      );
      let purchased: string[] = [];
      if (existing?.value) {
        try {
          purchased = JSON.parse(existing.value);
        } catch {
          purchased = [];
        }
      }
      if (!purchased.includes(id)) {
        purchased.push(id);
      }
      await txn.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('purchased_movement_layers', ?)",
        JSON.stringify(purchased)
      );
    });
    return { success: true };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : "Error al comprar";
    return { success: false, reason };
  }
}
