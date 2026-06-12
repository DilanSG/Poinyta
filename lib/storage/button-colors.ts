import { getDb } from "./db";

const ACTIVE_KEY = "active_button_color";
const CLAIMED_KEY = "free_points_claimed";

// Lee el color de boton activo desde settings. Retorna "default" si no
// hay configuracion previa o la clave no existe en la DB.
export async function getActiveButtonColor(): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    ACTIVE_KEY
  );
  return row?.value ?? "default";
}

// Persiste el ID del color de boton activo. Sobrescribe el valor anterior
// con INSERT OR REPLACE.
export async function setActiveButtonColor(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ACTIVE_KEY,
    id
  );
}

// Obtiene el Set de IDs de colores de boton comprados. Siempre incluye
// "default" como item gratuito base. Retorna solo {"default"} si no hay
// registros o el JSON esta corrupto.
export async function getPurchasedButtonColorIds(): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'purchased_button_colors'"
  );
  if (!rows.length) return new Set(["default"]);
  try {
    const ids: string[] = JSON.parse(rows[0].value);
    return new Set(["default", ...ids]);
  } catch {
    return new Set(["default"]);
  }
}

// Compra un color de boton: verifica puntos, deduce el costo y agrega
// el ID a la lista de comprados, todo en una transaccion exclusiva.
export async function purchaseButtonColor(
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
        "SELECT value FROM settings WHERE key = 'purchased_button_colors'"
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
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('purchased_button_colors', ?)",
        JSON.stringify(purchased)
      );
    });
    return { success: true };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : "Error al comprar";
    return { success: false, reason };
  }
}

// Verifica si el usuario ya reclamo los puntos gratis. Usa string "1"
// como flag booleano porque settings almacena todo como TEXT.
export async function hasClaimedFreePoints(): Promise<boolean> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    CLAIMED_KEY
  );
  return row?.value === "1";
}

// Otorga 50 puntos gratis al usuario (una unica vez por dispositivo).
// Corre dentro de una transaccion para que el incremento y el flag de
// "ya reclamado" se persistan juntos o no se persistan.
export async function claimFreePoints(): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + ?`,
      ["user_points", "50", 50]
    );
    await txn.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      CLAIMED_KEY,
      "1"
    );
  });
}
