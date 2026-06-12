import { getDb } from "./db";

const ACTIVE_KEY = "active_chart_color";

// Lee el esquema de color de graficos activo desde settings. Retorna
// "default" si no hay configuracion previa o la clave no existe.
export async function getActiveChartColor(): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    ACTIVE_KEY
  );
  return row?.value ?? "default";
}

// Persiste el ID del esquema de color de graficos activo. Sobrescribe
// cualquier valor anterior con INSERT OR REPLACE.
export async function setActiveChartColor(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ACTIVE_KEY,
    id
  );
}

// Obtiene el Set de IDs de esquemas de color comprados. Siempre incluye
// "default" como item gratuito base. Retorna solo {"default"} si no hay
// registros o el JSON esta corrupto.
export async function getPurchasedChartColorIds(): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'purchased_chart_colors'"
  );
  if (!rows.length) return new Set(["default"]);
  try {
    const ids: string[] = JSON.parse(rows[0].value);
    return new Set(["default", ...ids]);
  } catch {
    return new Set(["default"]);
  }
}

// Compra un esquema de color: verifica puntos, deduce el costo y agrega
// el ID a la lista de comprados, todo en una transaccion exclusiva.
export async function purchaseChartColor(
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
        "SELECT value FROM settings WHERE key = 'purchased_chart_colors'"
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
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('purchased_chart_colors', ?)",
        JSON.stringify(purchased)
      );
    });
    return { success: true };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : "Error al comprar";
    return { success: false, reason };
  }
}
