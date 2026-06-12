import { NativeModules, PermissionsAndroid, Platform, Linking } from "react-native";

export type SmsPermissionResult = "granted" | "denied" | "never_ask_again" | "unavailable";

export type SmsMessage = {
  address: string;
  body: string;
  date: number;
};

export type ParsedExpense = {
  id: string;
  amount: number;
  description: string;
  date: Date;
  sender: string;
  rawBody: string;
};

// Solicita permiso READ_SMS en Android. En iOS retorna "unavailable".
// El catch devuelve "denied" para que la UI pueda mostrar un estado
// consistente incluso si el dialogo del SO falla.
export async function requestSmsPermission(): Promise<SmsPermissionResult> {
  if (Platform.OS !== "android") return "unavailable";

  try {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    if (already) return "granted";

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "Permiso para leer mensajes",
        message:
          "Poinyta necesita acceder a tus mensajes SMS para detectar compras automáticamente. No se almacena ningún mensaje.",
        buttonPositive: "Permitir",
        buttonNegative: "Cancelar",
      }
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) return "granted";
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return "never_ask_again";
    return "denied";
  } catch {
    return "denied";
  }
}

// Abre los ajustes del sistema para que el usuario active permisos manualmente.
// Util cuando el permiso fue denegado con "never ask again".
export function openAppSettings(): void {
  Linking.openSettings();
}

// Lee los ultimos N SMS de la bandeja de entrada Android via el modulo
// nativo SmsReader (registrado en MainApplication.kt).
// Lanza error si el modulo no esta disponible (build sin recompilar).
export async function readSmsInbox(limit = 300): Promise<SmsMessage[]> {
  if (Platform.OS !== "android") return [];

  if (!NativeModules.SmsReader) {
    throw new Error(
      "El módulo nativo SmsReader no está disponible. " +
      "Revisa que esté registrado en MainApplication.kt y que la app haya sido recompilada."
    );
  }

  try {
    return ((await NativeModules.SmsReader.readInbox(limit)) as SmsMessage[]) ?? [];
  } catch {
    throw new Error("Error desconocido al leer SMS");
  }
}

const PURCHASE_RE =
  /compra|gasto|pago|transacci[oó]n|d[eé]bito|cr[eé]dito|retiro|cobro|cargo|consumo|factura|mov/i;

const AMOUNT_RE =
  /\$\s*([\d]{1,3}(?:[.,][\d]{3})*(?:[.,][\d]{0,2})?|\d{4,12})(?!\d)/;

const SPAM_KEYWORDS_RE =
  /ganaste|premio|sorteo|participa|gira|felicidades|bono\s+regalo|totalmente\s+gratis|curso|marketing|inversi[oó]n\s+segura|hazte\s+rico|retiro\s+de\s+dinero\s+(sin|gratis)|pr[eé]stamo\s+f[aá]cil/i;

// Normaliza montos escritos con notacion colombiana, donde el punto separa
// miles y la coma separa decimales (ej. "$1.500.000,50" → 1500000.50).
// La heuristica distingue entre coma decimal (2 digitos despues, monto
// pequeno) y coma de miles (muchos digitos despues o monto grande).
// Ver README §6.11: solo funciona con formato numerico colombiano.
function normalizeColombianAmount(raw: string): number {
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");

  let normalized: string;

  if (hasComma && hasDot) {
    if (commaIndex > dotIndex) {
      normalized = raw.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    const afterLastComma = raw.slice(commaIndex + 1);
    if (afterLastComma.length <= 2 && raw.length <= 6) {
      normalized = raw.replace(",", ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (hasDot && !hasComma) {
    const parts = raw.split(".");
    if (parts.length === 2 && parts[1].length <= 2 && raw.length <= 6) {
      normalized = raw;
    } else {
      normalized = raw.replace(/\./g, "");
    }
  } else {
    normalized = raw;
  }

  return parseFloat(normalized);
}

const BANK_SHORTCODE_RE = /^\d{3,8}$/;

const KNOWN_BANK_NAMES = [
  "bancolombia", "nequi", "davivienda", "bogotá", "bogota",
  "colpatria", "av villas", "popular", "occidente", "bbva",
  "gnb", "sudameris", "scotiabank", "citibank", "itau",
  "ban100", "banco de bogotá", "banco de bogota",
  "movii", "daviplata", "rappipay", "mercadopago",
  "addi", "nu colombia", "nubank", "lulo bank", "lulobank",
  "finandina", "jir", "coink", "vale", "sistecredito",
];

// Filtra remitentes que parecen bancos o servicios financieros colombianos.
// Banco: codigo corto numerico de 3-8 digitos o nombre en la lista blanca.
// Esto reduce falsos positivos con SMS promocionales o personales.
function looksLikeBankOrService(addr: string): boolean {
  const clean = addr.trim().toLowerCase();
  if (BANK_SHORTCODE_RE.test(clean)) return true;
  return KNOWN_BANK_NAMES.some((name) => clean.includes(name));
}

const MERCHANT_PATTERNS: RegExp[] = [
  /compra\s+en\s+([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+el\s|\s+del\s|\s+a\s+las|\s+de\s+\$|\s+\$|\.|$)/i,
  /pago\s+(?:a\s+|en\s+|por\s+)?([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+de\s+\$|\s+el\s|\s+a\s+las|\s+\$|\.|$)/i,
  /cargo\s+(?:a\s+|en\s+|por\s+)?([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+de\s+\$|\s+\$|\.|$)/i,
  /consumo\s+(?:en\s+|por\s+)?([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+de\s+\$|\s+\$|\.|$)/i,
  /factura\s+(?:de\s+|en\s+)?([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+de\s+\$|\s+\$|\.|$)/i,
  /retiro\s+(?:en\s+|por\s+)?([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{1,40}?)(?:\s+x\s|\s+por\s|\s+de\s+\$|\s+\$|\.|$)/i,
  /(?:en|por)\s+([a-záéíóúñ0-9][a-záéíóúñ0-9\s\-\.&/]{2,40}?)(?:\s+el\s|\s+por\s|\s+x\s|\s+de\s+\$|\s+\$|\.|$)/i,
];

function extractMerchant(body: string): string {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = body.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.length >= 2) return name;
    }
  }
  return "";
}

function extractFallbackDescription(body: string): string {
  const cleaned = body
    .replace(AMOUNT_RE, "")
    .replace(/[$]\s*/g, "")
    .replace(/[.,;:!?]+$/, "")
    .trim();

  const fragments = cleaned.split(/\s{2,}|\.\s|\\n/);
  for (const frag of fragments) {
    const trimmed = frag.trim();
    if (trimmed.length >= 5 && trimmed.length <= 60) {
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }
  }

  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
  if (words.length <= 6) {
    return cleaned.slice(0, 60);
  }

  return "";
}

// Clasifica mensajes SMS en gastos parseados. Flujo por mensaje:
// 1. Filtra por remitente bancario (looksLikeBankOrService)
// 2. Filtra por palabras de compra/gasto en espanol (PURCHASE_RE)
// 3. Descarta spam con SPAM_KEYWORDS_RE
// 4. Extrae monto con AMOUNT_RE y normaliza notacion colombiana
// 5. Deduplica por prefijo del cuerpo + monto (no por dia, para no
//    colapsar dos compras del mismo valor el mismo dia)
// 6. Extrae comercio con MERCHANT_PATTERNS o descripcion fallback
// Retorna arreglo ordenado descendente por fecha.
export function classifySmsMessages(messages: SmsMessage[]): ParsedExpense[] {
  const seen = new Set<string>();
  const results: ParsedExpense[] = [];

  for (const msg of messages) {
    const { body, address, date } = msg;

    if (!looksLikeBankOrService(address)) continue;

    if (!PURCHASE_RE.test(body)) continue;

    if (SPAM_KEYWORDS_RE.test(body)) continue;

    const amountMatch = body.match(AMOUNT_RE);
    if (!amountMatch) continue;

    const rawNum = amountMatch[1];
    const amount = normalizeColombianAmount(rawNum);
    if (isNaN(amount) || amount <= 0 || amount > 999_999_999) continue;

    // Usar un prefijo normalizado del cuerpo como clave de dedup, en vez de
    // monto+dia, para no colapsar dos compras del mismo valor el mismo dia.
    const bodyKey = body.slice(0, 80).replace(/\s+/g, " ").toLowerCase();
    const dedupeKey = `${bodyKey}-${Math.round(amount)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    let description = extractMerchant(body);
    if (!description) {
      description = extractFallbackDescription(body);
    }

    results.push({
      id: `${date}-${address}-${amount}`,
      amount,
      description,
      date: new Date(date),
      sender: address,
      rawBody: body,
    });
  }

  return results.sort((a, b) => b.date.getTime() - a.date.getTime());
}
