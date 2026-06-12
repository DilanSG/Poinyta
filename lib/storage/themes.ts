import { getDb } from "./db";

// Patron de tienda: cada item comprable (temas, fondos, colores, brillos,
// capas de movimiento) sigue la misma estructura:
// - settings: guarda el ID activo y un JSON array de IDs comprados
// - purchaseXxx: withExclusiveTransactionAsync para verificar puntos,
//   deducir y agregar a la lista de comprados como una sola operacion

const ACTIVE_THEME_KEY = "active_theme";

// Lee el ID del tema activo desde settings. Retorna "default" si no hay
// configuracion previa o la clave no existe.
export async function getActiveTheme(): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    ACTIVE_THEME_KEY
  );
  return row?.value ?? "default";
}

// Persiste el ID del tema activo. Sobrescribe cualquier valor anterior
// con INSERT OR REPLACE.
export async function setActiveTheme(themeId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ACTIVE_THEME_KEY,
    themeId
  );
}

// Obtiene el Set de IDs de temas comprados desde settings. Siempre incluye
// "default" como item gratuito base. Retorna solo {"default"} si no hay
// registros o el JSON esta corrupto.
export async function getPurchasedThemeIds(): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'purchased_themes'"
  );
  if (!rows.length) return new Set(["default"]);
  try {
    const ids: string[] = JSON.parse(rows[0].value);
    return new Set(["default", ...ids]);
  } catch {
    return new Set(["default"]);
  }
}

// Compra un tema: verifica puntos, deduce el costo y agrega el ID a la
// lista de comprados, todo dentro de una transaccion exclusiva para que
// un crash entre la deduccion y el registro no pierda puntos.
export async function purchaseTheme(
  themeId: string,
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
        "SELECT value FROM settings WHERE key = 'purchased_themes'"
      );
      let purchased: string[] = [];
      if (existing?.value) {
        try {
          purchased = JSON.parse(existing.value);
        } catch {
          purchased = [];
        }
      }
      if (!purchased.includes(themeId)) {
        purchased.push(themeId);
      }
      await txn.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('purchased_themes', ?)",
        JSON.stringify(purchased)
      );
    });
    return { success: true };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : "Error al comprar";
    return { success: false, reason };
  }
}
