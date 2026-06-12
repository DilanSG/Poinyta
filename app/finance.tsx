import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from "react-native";
import { useRef, useState, useMemo, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors, useGlow } from "../lib/theme";
import { useTransactions } from "../hooks/useTransactions";
import { Transaction, PeriodPoint } from "../lib/storage/types";
import { addTransactionsBatch, getMonthlyStats, getWeeklyBreakdownForMonth, getWeeklyStatsForWeek, getDailyBreakdownForWeekDate, getYearlyStats, getMonthlyBreakdownForYear, syncFromN8n } from "../lib/storage";
import { requestSmsPermission, readSmsInbox, classifySmsMessages, ParsedExpense, SmsPermissionResult, openAppSettings } from "../lib/native/SmsReader";
import { TransactionCard } from "../components/features/finance/TransactionCard";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import EmptyState from "../components/ui/EmptyState";
import AppText from "../components/ui/AppText";
import { useAlert } from "../components/ui/AlertModal";
import GlowView from "../components/ui/GlowView";

// ─── Gráfico de líneas ─────────────────────────────────────────────────────

const CHART_H = 100;
const DOT_R = 3;
const Y_AXIS_W = 44;
const PERIODS = ["Semana", "Mes", "Año"] as const;

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_ES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Formatea un valor numérico como etiqueta compacta para el eje Y.
function formatYVal(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 10_000) return `${Math.round(val / 1_000)}k`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return String(Math.round(val));
}

// Eje Y con tres etiquetas (máximo, mitad y cero) alineadas verticalmente al área del gráfico.
function YAxis({ maxVal }: { maxVal: number }) {
  const colors = useTheme();
  const lblStyle = { fontSize: 8, color: colors.textSecondary };
  return (
    <View style={{ width: Y_AXIS_W, height: CHART_H }}>
      <AppText
        numberOfLines={1}
        disableHorizontalPadding
        style={[lblStyle, { position: "absolute", top: 0, right: 4 }]}
      >
        {formatYVal(maxVal)}
      </AppText>
      <AppText
        numberOfLines={1}
        disableHorizontalPadding
        style={[lblStyle, { position: "absolute", top: CHART_H / 2 - 5, right: 4 }]}
      >
        {formatYVal(maxVal / 2)}
      </AppText>
      <AppText
        numberOfLines={1}
        disableHorizontalPadding
        style={[lblStyle, { position: "absolute", bottom: 0, right: 4 }]}
      >
        0
      </AppText>
    </View>
  );
}

// Renderiza un segmento de linea entre dos puntos usando una View con
// rotacion CSS. La linea se posiciona en el centro del segmento y se
// rota segun el angulo entre (x1,y1) y (x2,y2). Es una alternativa ligera
// a react-native-svg para graficos simples sin dependencias extra.
function lineSegmentStyle(
  x1: number, y1: number,
  x2: number, y2: number,
  color: string
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - length / 2,
    top: (y1 + y2) / 2 - 1,
    width: length,
    height: 2,
    backgroundColor: color,
    borderRadius: 1,
    transform: [{ rotate: `${angle}deg` }],
  };
}

// Gráfico de líneas comparativo (ingresos vs gastos) con puntos centrados en cada celda de etiqueta.
function FinanceLineChart({ data, maxVal }: { data: PeriodPoint[]; maxVal: number }) {
  const colors = useTheme();
  const [cw, setCw] = useState(0);
  const n = data.length;

  function getX(i: number): number {
    if (cw === 0 || n === 0) return 0;
    return cw * (i + 0.5) / n;
  }
  function getY(val: number): number {
    return CHART_H - (val / maxVal) * CHART_H;
  }

  return (
    <View
      style={{ height: CHART_H, position: "relative" }}
      onLayout={(e: LayoutChangeEvent) => setCw(e.nativeEvent.layout.width)}
    >
      {cw > 0 && (
        <>
          {data.slice(0, -1).map((_, i) => (
            <View key={`il${i}`} style={lineSegmentStyle(getX(i), getY(data[i].income), getX(i + 1), getY(data[i + 1].income), colors.chartPositive || colors.success)} />
          ))}
          {data.slice(0, -1).map((_, i) => (
            <View key={`el${i}`} style={lineSegmentStyle(getX(i), getY(data[i].expenses), getX(i + 1), getY(data[i + 1].expenses), colors.chartNegative || colors.error)} />
          ))}
          {data.map((p, i) => (
            <View key={`id${i}`} style={{ position: "absolute", width: DOT_R * 2, height: DOT_R * 2, borderRadius: DOT_R, backgroundColor: colors.chartPositive || colors.success, left: getX(i) - DOT_R, top: getY(p.income) - DOT_R }} />
          ))}
          {data.map((p, i) => (
            <View key={`ed${i}`} style={{ position: "absolute", width: DOT_R * 2, height: DOT_R * 2, borderRadius: DOT_R, backgroundColor: colors.chartNegative || colors.error, left: getX(i) - DOT_R, top: getY(p.expenses) - DOT_R }} />
          ))}
        </>
      )}
    </View>
  );
}

// Intenta extraer monto y descripción de un SMS bancario; devuelve objeto con amount/description o null.
function parseSmsText(text: string): { amount: number; description: string } | null {
  const amountMatch = text.match(/\$?\s*([\d]{1,3}(?:[.,][\d]{3})*(?:[.,][\d]{1,2})?)/);
  if (!amountMatch) return null;
  const rawNum = amountMatch[1].replace(/\./g, "").replace(",", ".");
  const amount = parseFloat(rawNum);
  if (isNaN(amount) || amount <= 0) return null;
  const descMatch = text.match(/(?:en|at|compra\s+en\s+)\s*([A-Za-z0-9\s\-\.]+?)(?:\s+el\b|\s+\d|\.|,|$)/i);
  const description = descMatch?.[1]?.trim() ?? "";
  return { amount, description };
}

// Formatea una cadena numérica cruda para mostrarla como monto con separadores de miles.
// La entrada usa punto como separador decimal (formato internacional),
// la salida usa coma como separador decimal y puntos para miles (formato chileno).
// Ej: "50000.50" → "50.000,50"
function formatAmountDisplay(raw: string): string {
  if (!raw) return "0";
  const [intPart, decPart] = raw.split(".");
  const formatted = parseInt(intPart || "0", 10).toLocaleString("es");
  return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}

// ─── Selector de fecha (calendario) ──────────────────────────────────────────

// Devuelve la fecha del lunes de la semana actual con hora en 00:00:00.
function getCurrentWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Formatea el rango de fechas de una semana dado su lunes, ej. "26 may – 1 jun 2026".
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()]}`;
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  return sameYear
    ? `${fmt(monday)} – ${fmt(sunday)} ${monday.getFullYear()}`
    : `${fmt(monday)} ${monday.getFullYear()} – ${fmt(sunday)} ${sunday.getFullYear()}`;
}

type CalendarPickerProps = {
  selected: Date;
  onSelect: (d: Date) => void;
};

// Calendario mensual para elegir un día pasado o el actual. No permite seleccionar fechas futuras.
function CalendarPicker({ selected, onSelect }: CalendarPickerProps) {
  const colors = useTheme();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const DOW = ["L", "M", "X", "J", "V", "S", "D"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // getDay() devuelve 0=Dom, 1=Lun... Para que el calendario arranque
  // en lunes, se transforma con (firstDow + 6) % 7: domingo (0) → 6,
  // lunes (1) → 0, etc. Los null del inicio son celdas vacias antes del dia 1.
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  function isFuture(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d > today;
  }
  function isSelected(day: number): boolean {
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    );
  }
  function isToday(day: number): boolean {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }
  function prevCal() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextCal() {
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }
  function selectDay(day: number) {
    if (isFuture(day)) return;
    onSelect(new Date(viewYear, viewMonth, day, 12, 0, 0));
  }

  const canGoNext = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 8, backgroundColor: colors.background }}>
      {/* Cabecera mes/año */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity onPress={prevCal} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>
          {MONTHS_ES[viewMonth]} {viewYear}
        </AppText>
        <TouchableOpacity onPress={nextCal} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} disabled={!canGoNext}>
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? colors.textPrimary : colors.border} />
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <View style={{ flexDirection: "row", marginBottom: 2 }}>
        {DOW.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center", paddingBottom: 4 }}>
            <AppText disableHorizontalPadding style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>

      {/* Grilla de días */}
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((day, ci) =>
            day ? (
              <TouchableOpacity
                key={ci}
                activeOpacity={0.7}
                disabled={isFuture(day)}
                onPress={() => selectDay(day)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 7,
                  borderRadius: 8,
                  backgroundColor: isSelected(day) ? colors.primary : "transparent",
                }}
              >
                <AppText
                  disableHorizontalPadding
                  style={{
                    fontSize: 13,
                    fontWeight: isToday(day) && !isSelected(day) ? "700" : "400",
                    color: isSelected(day)
                      ? colors.surface
                      : isFuture(day)
                      ? colors.border
                      : isToday(day)
                      ? colors.primary
                      : colors.textPrimary,
                  }}
                >
                  {day}
                </AppText>
              </TouchableOpacity>
            ) : (
              <View key={ci} style={{ flex: 1 }} />
            )
          )}
        </View>
      ))}
    </View>
  );
}

// Pantalla de Finanzas: gráfico deslizable por periodo, stats por periodo, listado de movimientos editables.
export default function FinanceScreen() {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { glowStyle } = useGlow();
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;

  const {
    transactions,
    incomeCategories,
    expenseCategories,
    weekStats,
    monthStats,
    yearStats,
    weekBreakdown,
    monthBreakdown,
    yearBreakdown,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    reload,
  } = useTransactions();
  const { showAlert } = useAlert();

  // ─── Period pager ────────────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const [activePeriod, setActivePeriod] = useState(0);

  // ─── Navegación de semana ────────────────────────────────────────────────
  const [navWeekMonday, setNavWeekMonday] = useState(() => getCurrentWeekMonday());
  const [navWeekStats, setNavWeekStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [navWeekBreakdown, setNavWeekBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 7 }, () => ({ income: 0, expenses: 0 }))
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ws, wb] = await Promise.all([
        getWeeklyStatsForWeek(navWeekMonday),
        getDailyBreakdownForWeekDate(navWeekMonday),
      ]);
      if (!cancelled) {
        setNavWeekStats(ws);
        setNavWeekBreakdown(wb);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navWeekMonday, transactions]);

  // Retrocede una semana en la navegación.
  function prevWeek() {
    setNavWeekMonday((m) => {
      const prev = new Date(m);
      prev.setDate(m.getDate() - 7);
      return prev;
    });
  }

  // Avanza una semana, sin pasar de la semana actual.
  function nextWeek() {
    if (navWeekMonday.getTime() >= getCurrentWeekMonday().getTime()) return;
    setNavWeekMonday((m) => {
      const next = new Date(m);
      next.setDate(m.getDate() + 7);
      return next;
    });
  }

  // ─── Navegación de mes ───────────────────────────────────────────────────
  const [navMonth, setNavMonth] = useState(new Date().getMonth());
  const [navYear, setNavYear] = useState(new Date().getFullYear());
  const [navMonthStats, setNavMonthStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [navMonthBreakdown, setNavMonthBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 4 }, () => ({ income: 0, expenses: 0 }))
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ms, mb] = await Promise.all([
        getMonthlyStats(navYear, navMonth),
        getWeeklyBreakdownForMonth(navYear, navMonth),
      ]);
      if (!cancelled) {
        setNavMonthStats(ms);
        setNavMonthBreakdown(mb);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navYear, navMonth, transactions]);

  // Retrocede un mes en la navegación del gráfico mensual.
  function prevMonth() {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  }

  // Avanza un mes en la navegación, sin pasar del mes actual.
  function nextMonth() {
    const now = new Date();
    if (navYear === now.getFullYear() && navMonth === now.getMonth()) return;
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  }

  // ─── Navegación de año ─────────────────────────────────────────────────
  const [navYearNum, setNavYearNum] = useState(new Date().getFullYear());
  const [navYearStats, setNavYearStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [navYearBreakdown, setNavYearBreakdown] = useState<PeriodPoint[]>(
    Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }))
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ys, yb] = await Promise.all([
        getYearlyStats(navYearNum),
        getMonthlyBreakdownForYear(navYearNum),
      ]);
      if (!cancelled) {
        setNavYearStats(ys);
        setNavYearBreakdown(yb);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navYearNum, transactions]);

  // Retrocede un año en la navegación.
  function prevYear() {
    setNavYearNum((y) => y - 1);
  }

  // Avanza un año, sin pasar del año actual.
  function nextYear() {
    if (navYearNum >= new Date().getFullYear()) return;
    setNavYearNum((y) => y + 1);
  }

  const statsByPeriod = [navWeekStats, navMonthStats, navYearStats];
  const breakdownByPeriod = [navWeekBreakdown, navMonthBreakdown, navYearBreakdown];

  // Desplaza el pager al periodo seleccionado (0=Semana, 1=Mes, 2=Año).
  function scrollToPeriod(i: number) {
    scrollRef.current?.scrollTo({ x: i * cardWidth, animated: true });
    setActivePeriod(i);
  }

  // Sincroniza el indicador activo al deslizar el pager manualmente.
  function handlePeriodScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    if (page !== activePeriod) setActivePeriod(page);
  }

  // ─── Modal de movimiento ─────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [dateMode, setDateMode] = useState<"auto" | "manual">("auto");
  const [calDate, setCalDate] = useState(new Date());

  // ─── Modal de importación ─────────────────────────────────────────────────
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStep, setImportStep] = useState<"menu" | "n8n">("menu");
  const [importLoading, setImportLoading] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  // SMS import state - se maneja fuera del Modal para evitar conflicto de
  // dialogos con PermissionsAndroid en New Architecture (Fabric).
  const [showSmsImport, setShowSmsImport] = useState(false);
  const [smsPermission, setSmsPermission] = useState<"unknown" | "granted" | "denied" | "never_ask_again">("unknown");
  const [smsSearching, setSmsSearching] = useState(false);
  const [smsList, setSmsList] = useState<ParsedExpense[]>([]);
  const [selectedSms, setSelectedSms] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () => (isExpense ? expenseCategories : incomeCategories),
    [isExpense, incomeCategories, expenseCategories]
  );

  function resetForm() {
    setIsExpense(true);
    setAmount("");
    setTitle("");
    setCategory("");
    setShowCategoryAdd(false);
    setNewCatName("");
    setDateMode("auto");
    setCalDate(new Date());
    setEditingTx(null);
  }

  // Abre el modal vacío para crear un nuevo movimiento.
  function openAdd() {
    resetForm();
    setModalVisible(true);
  }

  // Abre el modal precargado con los datos de un movimiento existente para editarlo.
  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setIsExpense(tx.type === "expense");
    setAmount(String(tx.amount));
    setTitle(tx.description);
    setCategory(tx.category);
    setDateMode("manual");
    setCalDate(new Date(tx.date));
    setShowCategoryAdd(false);
    setNewCatName("");
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    resetForm();
  }

  // Guarda el movimiento: actualiza si hay edición en curso, crea uno nuevo si no.
  async function handleSave() {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      showAlert("Monto inválido", "Ingresa un monto mayor a cero.");
      return;
    }
    if (!category) {
      showAlert("Falta categoría", "Selecciona una categoría.");
      return;
    }
    const txDate =
      dateMode === "manual"
        ? new Date(calDate.getFullYear(), calDate.getMonth(), calDate.getDate(), 12, 0, 0).toISOString()
        : undefined;
    if (editingTx) {
      await updateTransaction(editingTx.id, {
        type: isExpense ? "expense" : "income",
        amount: value,
        description: title.trim(),
        category,
        ...(txDate !== undefined ? { date: txDate } : {}),
      });
    } else {
      await addTransaction({
        type: isExpense ? "expense" : "income",
        amount: value,
        description: title.trim(),
        category,
        ...(txDate !== undefined ? { date: txDate } : {}),
      });
    }
    closeModal();
  }

  // Muestra confirmación y elimina el movimiento en edición.
  function handleDelete(id: string) {
    showAlert("Eliminar movimiento", "¿Deseas borrar esta transacción?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteTransaction(id);
          closeModal();
        },
      },
    ]);
  }

  // Agrega una nueva categoría al tipo activo y la selecciona en el formulario.
  async function handleAddCategory() {
    const term = newCatName.trim();
    if (!term) return;
    await addCategory(isExpense ? "expense" : "income", term);
    setCategory(term);
    setNewCatName("");
    setShowCategoryAdd(false);
  }

  // Maneja la entrada del teclado numérico del modal de movimiento.
  // Teclado numerico personalizado para el campo de monto. Reglas:
  // - Solo un punto decimal permitido, maximo 2 decimales.
  // - Maximo 10 digitos enteros (previene overflow con numeros enormes).
  // - Si el usuario empieza con "0" y tipea un digito, reemplaza el 0 (ej: "05" → "5").
  // - ⌫ borra el ultimo caracter (o limpia todo si solo queda 1 caracter).
  function handleNumpad(key: string) {
    if (key === "⌫") {
      setAmount((v) => (v.length > 1 ? v.slice(0, -1) : ""));
      return;
    }
    if (key === "." && amount.includes(".")) return;
    if (key === "." && amount === "") { setAmount("0."); return; }
    const dotIdx = amount.indexOf(".");
    if (dotIdx !== -1 && amount.length - dotIdx > 2) return;
    if (amount.replace(/[.,]/g, "").length >= 10) return;
    setAmount((v) => (v === "0" && key !== "." ? key : v === "" ? key : v + key));
  }

  // Sincroniza movimientos pendientes desde el flujo n8n.
  async function handleSyncN8n() {
    setImportLoading(true);
    setImportError(null);
    setImportCount(null);
    try {
      const count = await syncFromN8n();
      setImportCount(count);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Error al sincronizar.");
    } finally {
      setImportLoading(false);
    }
  }

  // Solicita permiso READ_SMS, lee el inbox y clasifica compras automaticamente.
  async function handleSmsScan() {
    // Feedback inmediato al usuario: muestra "Analizando mensajes..."
    // incluso antes de pedir el permiso, para que sepa que el boton respondio.
    setSmsSearching(true);
    setSmsPermission("unknown");
    setImportError(null);

    try {
      // Timeout de 20s por si el dialogo de permisos no aparece o el usuario
      // no responde. En algunos dispositivos PermissionsAndroid puede colgarse
      // si la Activity no esta en primer plano.
      const timeoutPromise = new Promise<SmsPermissionResult>((_, reject) =>
        setTimeout(() => reject(new Error("La solicitud de permiso no respondió. Reintenta.")), 20000)
      );
      const result = await Promise.race([requestSmsPermission(), timeoutPromise]);

      if (result !== "granted") {
        setSmsPermission(result === "never_ask_again" ? "never_ask_again" : "denied");
        setSmsSearching(false);
        return;
      }
      setSmsPermission("granted");

      const messages = await readSmsInbox(300);
      const found = classifySmsMessages(messages);
      setSmsList(found);
      setSelectedSms(new Set(found.map((e) => e.id)));
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Error al solicitar permiso o leer SMS.");
    } finally {
      setSmsSearching(false);
    }
  }

  // Registra como gastos todos los elementos seleccionados de la lista SMS.
  async function handleSmsAddSelected() {
    const toAdd = smsList.filter((e) => selectedSms.has(e.id));
    await addTransactionsBatch(
      toAdd.map((expense) => ({
        type: "expense" as const,
        amount: expense.amount,
        description: expense.description,
        category: expenseCategories[0] ?? "General",
        date: new Date(
          expense.date.getFullYear(),
          expense.date.getMonth(),
          expense.date.getDate(),
          12, 0, 0
        ).toISOString(),
      }))
    );
    closeImportModal();
    reload();
  }

  // Alterna la selección de un gasto SMS detectado.
  function toggleSmsItem(id: string) {
    setSelectedSms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Cierra el modal de importación y resetea su estado.
  function closeImportModal() {
    setImportModalVisible(false);
    setShowSmsImport(false);
    setImportStep("menu");
    setImportCount(null);
    setImportError(null);
    setSmsPermission("unknown");
    setSmsSearching(false);
    setSmsList([]);
    setSelectedSms(new Set());
  }

  return (
    <View style={styles.container}>
      <BackgroundDecor colors={colors} screenVariant={1} />
      {showSmsImport ? (
        /* Vista completa de importacion SMS - fuera del Modal RN para
           evitar conflicto con PermissionsAndroid en New Architecture.
           Cuando importModalVisible se setea a false, el Modal cierra con
           animacion pero sigue en un Dialog de Android encima de todo.
           Al renderizar condicionalmente este bloque en vez de un overlay,
           el Modal desaparece del arbol completamente y el dialogo de
           permiso se muestra sin interferencias. */
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.smsOverlayHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
              <AppText style={styles.smsOverlayTitle}>Importar desde SMS</AppText>
            </View>
            <TouchableOpacity onPress={() => { closeImportModal(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.smsScroll} keyboardShouldPersistTaps="handled">
            {smsPermission === "unknown" && smsList.length === 0 && !smsSearching && (
              <View style={styles.smsEmptyState}>
                <View style={styles.smsEmptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.primary} />
                </View>
                <AppText style={styles.smsEmptyTitle}>Escanea tus SMS</AppText>
                <AppText style={styles.smsEmptyDesc}>
                  Poinyta buscará compras en tus últimos mensajes bancarios y te mostrará una lista para que elijas qué registrar.
                </AppText>
                <TouchableOpacity style={styles.smsStartButton} onPress={handleSmsScan}>
                  <Ionicons name="scan-outline" size={20} color={colors.surface} />
                  <AppText style={styles.smsStartButtonText}>Buscar compras</AppText>
                </TouchableOpacity>
              </View>
            )}

            {smsSearching && (
              <View style={styles.smsEmptyState}>
                <View style={[styles.smsEmptyIconWrap, { borderColor: colors.primary }]}>
                  <Ionicons name="search-outline" size={40} color={colors.primary} />
                </View>
                <AppText style={styles.smsEmptyTitle}>Analizando mensajes...</AppText>
                <AppText style={styles.smsEmptyDesc}>
                  Revisando los últimos 300 SMS en busca de compras.
                </AppText>
              </View>
            )}

            {importError && smsPermission === "granted" && !smsSearching && (
              <View style={[styles.importFeedback, { borderColor: colors.error, marginHorizontal: 16 }]}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <AppText style={[styles.importFeedbackText, { color: colors.error }]}>
                  {importError}
                </AppText>
              </View>
            )}

            {smsPermission === "denied" && (
              <View style={styles.smsEmptyState}>
                <View style={[styles.smsEmptyIconWrap, { borderColor: colors.error }]}>
                  <Ionicons name="close-circle-outline" size={40} color={colors.error} />
                </View>
                <AppText style={[styles.smsEmptyTitle, { color: colors.error }]}>
                  Permiso denegado
                </AppText>
                <AppText style={styles.smsEmptyDesc}>
                  No se concedió el acceso a SMS. Puedes intentarlo de nuevo.
                </AppText>
                <TouchableOpacity style={styles.smsStartButton} onPress={handleSmsScan}>
                  <Ionicons name="refresh-outline" size={20} color={colors.surface} />
                  <AppText style={styles.smsStartButtonText}>Intentar de nuevo</AppText>
                </TouchableOpacity>
              </View>
            )}

            {smsPermission === "never_ask_again" && (
              <View style={styles.smsEmptyState}>
                <View style={[styles.smsEmptyIconWrap, { borderColor: colors.warning }]}>
                  <Ionicons name="lock-closed-outline" size={40} color={colors.warning} />
                </View>
                <AppText style={[styles.smsEmptyTitle, { color: colors.warning }]}>
                  Permiso bloqueado
                </AppText>
                <AppText style={styles.smsEmptyDesc}>
                  El permiso fue denegado permanentemente. Para activarlo ve a Ajustes del sistema, busca Poinyta en la lista de apps y habilita el permiso de SMS.
                </AppText>
                <TouchableOpacity style={styles.smsStartButton} onPress={openAppSettings}>
                  <Ionicons name="settings-outline" size={20} color={colors.surface} />
                  <AppText style={styles.smsStartButtonText}>Abrir Ajustes</AppText>
                </TouchableOpacity>
              </View>
            )}

            {smsPermission === "granted" && smsList.length === 0 && !smsSearching && !importError && (
              <View style={styles.smsEmptyState}>
                <View style={[styles.smsEmptyIconWrap, { borderColor: colors.textSecondary }]}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={colors.textSecondary} />
                </View>
                <AppText style={styles.smsEmptyTitle}>Sin resultados</AppText>
                <AppText style={styles.smsEmptyDesc}>
                  No se encontraron compras en los mensajes recientes.
                </AppText>
              </View>
            )}

            {smsList.length > 0 && !smsSearching && (
              <>
                <View style={styles.smsResultHeader}>
                  <AppText style={styles.smsResultCount}>
                    {smsList.length} compra{smsList.length === 1 ? "" : "s"} detectada{smsList.length === 1 ? "" : "s"}
                  </AppText>
                  <AppText style={styles.smsResultSub}>Selecciona las que quieras registrar</AppText>
                </View>
                <View style={styles.smsListWrap}>
                  {smsList.map((expense) => {
                    const isSelected = selectedSms.has(expense.id);
                    return (
                      <TouchableOpacity
                        key={expense.id}
                        style={[styles.smsCard, glowStyle, isSelected && styles.smsCardSelected]}
                        onPress={() => toggleSmsItem(expense.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.smsCheckbox, isSelected && styles.smsCheckboxSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <AppText style={styles.smsCardAmount}>
                              -${expense.amount.toLocaleString("es", { minimumFractionDigits: 0 })}
                            </AppText>
                            <AppText style={styles.smsCardDate}>
                              {expense.date.toLocaleDateString("es", { day: "2-digit", month: "short" })}
                            </AppText>
                          </View>
                          <AppText style={styles.smsCardDesc} numberOfLines={2}>
                            {expense.description || expense.rawBody.slice(0, 60)}
                          </AppText>
                          <AppText style={styles.smsCardMeta}>
                            {expense.sender ? `${expense.sender}` : ""}
                          </AppText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={[styles.smsAddButton, selectedSms.size === 0 && { opacity: 0.5 }]}
                  onPress={handleSmsAddSelected}
                  disabled={selectedSms.size === 0}
                >
                  <Ionicons name="download-outline" size={20} color={colors.surface} />
                  <AppText style={styles.smsAddButtonText}>
                    Agregar {selectedSms.size} gasto{selectedSms.size === 1 ? "" : "s"}
                  </AppText>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Tarjeta de periodos (gráfico + estadísticas) ── */}
        <GlowView style={styles.periodCard} cardRadius={12}>
          <View style={styles.tabs}>
            {PERIODS.map((label, i) => (
              <TouchableOpacity
                key={label}
                style={styles.tab}
                onPress={() => scrollToPeriod(i)}
                activeOpacity={0.7}
              >
                <AppText style={[styles.tabLabel, activePeriod === i && styles.tabLabelActive]}>
                  {label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.indicatorTrack}>
            <View
              style={[
                styles.indicatorBar,
                { width: `${100 / 3}%`, left: `${(activePeriod * 100) / 3}%` },
              ]}
            />
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePeriodScroll}
            scrollEventThrottle={32}
          >
            {statsByPeriod.map((stats, i) => {
              const data = breakdownByPeriod[i];
              const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)), 1);
              const isPositive = stats.balance >= 0;

              const xLabels =
                i === 0 ? DAYS_ES :
                i === 1 ? ["Sem 1", "Sem 2", "Sem 3", "Sem 4"] :
                MONTHS_ES_SHORT;

              const now = new Date();
              const navLabel =
                i === 0
                  ? formatWeekRange(navWeekMonday)
                  : i === 1
                  ? `${MONTHS_ES[navMonth]} ${navYear}`
                  : String(navYearNum);
              const onPrevNav = i === 0 ? prevWeek : i === 1 ? prevMonth : prevYear;
              const onNextNav = i === 0 ? nextWeek : i === 1 ? nextMonth : nextYear;
              const canGoNext =
                i === 0
                  ? navWeekMonday.getTime() < getCurrentWeekMonday().getTime()
                  : i === 1
                  ? !(navYear === now.getFullYear() && navMonth === now.getMonth())
                  : navYearNum < now.getFullYear();

              return (
                <View key={i} style={[styles.page, { width: cardWidth }]}>
                  {/* Navegación de periodo */}
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      onPress={onPrevNav}
                      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <AppText style={styles.monthNavLabel}>{navLabel}</AppText>
                    <TouchableOpacity
                      onPress={onNextNav}
                      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                      disabled={!canGoNext}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={canGoNext ? colors.textSecondary : colors.border}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Gráfico con eje Y */}
                  <View style={styles.chartRow}>
                    <YAxis maxVal={maxVal} />
                    <View style={{ flex: 1 }}>
                      <FinanceLineChart data={data} maxVal={maxVal} />
                      <View style={styles.xLabels}>
                        {xLabels.map((label, j) => (
                          <View key={j} style={styles.xLabelCell}>
                            <AppText
                              style={styles.xLabel}
                              numberOfLines={1}
                              disableHorizontalPadding
                            >
                              {label}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Fila de estadísticas */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <AppText style={[styles.statLabel, styles.textCenter]}>Ingresos</AppText>
                      <AppText
                        style={[styles.statValue, styles.incomeColor, styles.textCenter]}
                        numberOfLines={1}
                      >
                        +{stats.income.toLocaleString("es", { minimumFractionDigits: 0 })}
                      </AppText>
                    </View>
                    <View style={[styles.statItem, styles.statItemCenter]}>
                      <AppText style={[styles.statLabel, styles.textCenter]}>Balance</AppText>
                      <AppText
                        style={[
                          styles.statValue,
                          styles.textCenter,
                          isPositive ? styles.incomeColor : styles.expenseColor,
                        ]}
                        numberOfLines={1}
                      >
                        {isPositive ? "+" : ""}
                        {stats.balance.toLocaleString("es", { minimumFractionDigits: 0 })}
                      </AppText>
                    </View>
                    <View style={[styles.statItem, styles.statItemRight]}>
                      <AppText style={[styles.statLabel, styles.textCenter]}>Gastos</AppText>
                      <AppText
                        style={[styles.statValue, styles.expenseColor, styles.textCenter]}
                        numberOfLines={1}
                      >
                        -{stats.expenses.toLocaleString("es", { minimumFractionDigits: 0 })}
                      </AppText>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: colors.chartPositive || colors.success }]} />
            <AppText style={styles.legendText}>Ingresos</AppText>
            <View style={[styles.legendDot, { backgroundColor: colors.chartNegative || colors.error }]} />
            <AppText style={styles.legendText}>Gastos</AppText>
          </View>
        </GlowView>

        {/* ── Lista de movimientos ── */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Movimientos</AppText>
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => { setImportStep("menu"); setImportModalVisible(true); }}
          >
            <Ionicons name="cloud-download-outline" size={13} color={colors.primary} />
            <AppText style={styles.importButtonText}>Importar</AppText>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Sin movimientos"
            subtitle="Tus transacciones aparecerán aquí"
          />
        ) : (
          transactions.map((tx) => (
            <TransactionCard key={tx.id} item={tx} onPress={() => openEdit(tx)} />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      {/* Modal agregar / editar movimiento */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalView}
          >
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>
                {editingTx
                  ? (isExpense ? "Editar gasto" : "Editar ingreso")
                  : (isExpense ? "Nuevo gasto" : "Nuevo ingreso")}
              </AppText>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Selector de tipo */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, isExpense && styles.expenseBg]}
                  onPress={() => { setIsExpense(true); setCategory(""); }}
                >
                  <AppText style={[styles.typeButtonText, isExpense && styles.whiteText]}>
                    Gasto
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, !isExpense && styles.incomeBg]}
                  onPress={() => { setIsExpense(false); setCategory(""); }}
                >
                  <AppText style={[styles.typeButtonText, !isExpense && styles.whiteText]}>
                    Ingreso
                  </AppText>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder={isExpense ? "Concepto de gasto" : "Concepto de ingreso"}
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />

              {/* Monto con teclado numérico */}
              <GlowView style={styles.amountDisplay} cardRadius={12}>
                <AppText style={styles.amountDisplayText}>
                  ${formatAmountDisplay(amount)}
                </AppText>
              </GlowView>
              <View style={styles.numpad}>
                {([["1","2","3"],["4","5","6"],["7","8","9"],["." ,"0","⌫"]] as string[][]).map((row, ri) => (
                  <View key={ri} style={styles.numpadRow}>
                    {row.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.numpadKey}
                        onPress={() => handleNumpad(key)}
                        activeOpacity={0.6}
                      >
                        <AppText style={styles.numpadKeyText}>{key}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              <AppText style={styles.label}>Categoría</AppText>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBadge, category === cat && styles.categoryBadgeSelected]}
                    onPress={() => setCategory(cat)}
                  >
                    <AppText
                      style={[styles.categoryBadgeText, category === cat && styles.whiteText]}
                    >
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addCategoryBadge}
                  onPress={() => setShowCategoryAdd(!showCategoryAdd)}
                >
                  <Ionicons
                    name={showCategoryAdd ? "close" : "add"}
                    size={14}
                    color={colors.primary}
                  />
                  <AppText style={styles.addCategoryText}>Nueva</AppText>
                </TouchableOpacity>
              </View>

              {showCategoryAdd && (
                <View style={styles.newCatRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Nombre de categoría"
                    placeholderTextColor={colors.textSecondary}
                    value={newCatName}
                    onChangeText={setNewCatName}
                  />
                  <TouchableOpacity style={styles.newCatAdd} onPress={handleAddCategory}>
                    <Ionicons name="checkmark" size={22} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Selector de fecha */}
              <AppText style={[styles.label, { marginTop: 4 }]}>Fecha</AppText>
              <View style={styles.dateModeRow}>
                <TouchableOpacity
                  style={[styles.dateModeBtn, dateMode === "auto" && styles.dateModeBtnActive]}
                  onPress={() => setDateMode("auto")}
                >
                  <AppText style={[styles.dateModeBtnText, dateMode === "auto" && styles.whiteText]}>
                    Automático
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateModeBtn, dateMode === "manual" && styles.dateModeBtnActive]}
                  onPress={() => setDateMode("manual")}
                >
                  <AppText style={[styles.dateModeBtnText, dateMode === "manual" && styles.whiteText]}>
                    Elegir día
                  </AppText>
                </TouchableOpacity>
              </View>

              {dateMode === "manual" && (
                <CalendarPicker selected={calDate} onSelect={setCalDate} />
              )}

              {editingTx ? (
                <View style={styles.editActionsRow}>
                  <TouchableOpacity style={styles.editSaveButton} onPress={handleSave}>
                    <Ionicons name="checkmark-outline" size={18} color={colors.surface} />
                    <AppText style={styles.saveButtonText}>Guardar</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editDeleteButton}
                    onPress={() => handleDelete(editingTx.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <AppText style={styles.deleteButtonText}>Eliminar</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="checkmark-outline" size={18} color={colors.surface} />
                  <AppText style={styles.saveButtonText}>Registrar</AppText>
                </TouchableOpacity>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal de importaci\u00f3n autom\u00e1tica */}
      <Modal
        animationType="slide"
        transparent
        visible={importModalVisible}
        onRequestClose={closeImportModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.modalView, { maxHeight: "80%" }]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {importStep !== "menu" && (
                  <TouchableOpacity
                    onPress={() => {
                      setImportStep("menu");
                      setImportCount(null);
                      setImportError(null);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                )}
                <AppText style={styles.modalTitle}>
                  {importStep === "menu" ? "Importar movimientos" : "Flujo n8n"}
                </AppText>
              </View>
              <TouchableOpacity onPress={closeImportModal}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {importStep === "menu" && (
                <>
                  <TouchableOpacity
                    style={[styles.importOptionCard, glowStyle]}
                    onPress={() => { setImportStep("n8n"); setImportCount(null); setImportError(null); }}
                  >
                    <Ionicons name="git-network-outline" size={28} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <AppText style={styles.importOptionTitle}>Flujo n8n</AppText>
                      <AppText style={styles.importOptionDesc}>
                        Importa movimientos pendientes desde tu flujo de automatización
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.importOptionCard, glowStyle]}
                    onPress={() => { setImportModalVisible(false); setShowSmsImport(true); setSmsPermission("unknown"); setSmsList([]); setSelectedSms(new Set()); setImportError(null); }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <AppText style={styles.importOptionTitle}>Leer SMS</AppText>
                      <AppText style={styles.importOptionDesc}>
                        Busca compras entre tus mensajes bancarios y elige cuáles registrar
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}

              {importStep === "n8n" && (
                <>
                  <AppText style={styles.importHint}>
                    Descarga los movimientos registrados en tu flujo n8n y los añade a Poinyta.
                  </AppText>
                  {importCount !== null && (
                    <View style={[styles.importFeedback, { borderColor: colors.success }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                      <AppText style={[styles.importFeedbackText, { color: colors.success }]}>
                        {importCount === 0
                          ? "No hay movimientos pendientes"
                          : `${importCount} movimiento${importCount === 1 ? "" : "s"} importado${importCount === 1 ? "" : "s"}`}
                      </AppText>
                    </View>
                  )}
                  {importError !== null && (
                    <View style={[styles.importFeedback, { borderColor: colors.error }]}>
                      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                      <AppText style={[styles.importFeedbackText, { color: colors.error }]}>
                        {importError}
                      </AppText>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.saveButton, importLoading && { opacity: 0.6 }]}
                    onPress={handleSyncN8n}
                    disabled={importLoading}
                  >
                    <AppText style={styles.saveButtonText}>
                      {importLoading ? "Sincronizando..." : "Sincronizar ahora"}
                    </AppText>
                  </TouchableOpacity>
                </>
              )}

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
        </>
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: 16,
    },

    // Period card
    periodCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    },
    tabs: {
      flexDirection: "row",
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    indicatorTrack: {
      height: 2,
      backgroundColor: colors.border,
      position: "relative",
    },
    indicatorBar: {
      position: "absolute",
      height: 2,
      backgroundColor: colors.primary,
    },
    page: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
    },
    xLabels: {
      flexDirection: "row",
      marginTop: 4,
      marginBottom: 4,
    },
    xLabelCell: {
      flex: 1,
      alignItems: "center",
    },
    xLabel: {
      fontSize: 9,
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: "row",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    statItem: {
      flex: 1,
      minWidth: 0,
    },
    statItemCenter: {},
    statItemRight: {},
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    incomeColor: {
      color: colors.chartPositive || colors.success,
    },
    expenseColor: {
      color: colors.chartNegative || colors.error,
    },
    textCenter: {
      textAlign: "center" as const,
    },
    textRight: {
      textAlign: "right" as const,
    },
    chartRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
    },
    monthNav: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: 8,
    },
    monthNavLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.textPrimary,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginRight: 8,
    },

    // Transactions
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    // FAB
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    // Overlay para importacion SMS (fuera del Modal RN para evitar
    // conflicto con PermissionsAndroid en New Architecture).
    smsOverlayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    smsOverlayTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    smsScroll: {
      padding: 16,
      paddingBottom: 40,
      flexGrow: 1,
    },
    smsEmptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
    smsEmptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    smsEmptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: "center",
    },
    smsEmptyDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 12,
    },
    smsStartButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    smsStartButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.surface,
    },
    smsResultHeader: {
      marginBottom: 16,
    },
    smsResultCount: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    smsResultSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    smsListWrap: {
      gap: 10,
      marginBottom: 20,
    },
    smsCardDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    smsAddButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
    },
    smsAddButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.surface,
    },
    modalView: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    modalScroll: {
      padding: 16,
      paddingBottom: 32,
    },

    // Form
    typeSelector: {
      flexDirection: "row",
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    expenseBg: {
      backgroundColor: colors.error,
    },
    incomeBg: {
      backgroundColor: colors.success,
    },
    whiteText: {
      color: colors.surface,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    categoryBadge: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    categoryBadgeSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryBadgeText: {
      fontSize: 12,
      color: colors.textPrimary,
    },
    addCategoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderColor: colors.primary,
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 4,
    },
    addCategoryText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },
    newCatRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    newCatAdd: {
      backgroundColor: colors.success,
      borderRadius: 10,
      width: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      marginTop: 8,
    },
    saveButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
    },
    editActionsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    editSaveButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
    },
    editDeleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "transparent",
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.error,
      padding: 16,
    },
    deleteButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.error,
    },

    // Date mode selector
    dateModeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    dateModeBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    dateModeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateModeBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    // Amount display
    amountDisplay: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      marginBottom: 10,
    },
    amountDisplayText: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },

    // Numpad
    numpad: {
      gap: 6,
      marginBottom: 16,
    },
    numpadRow: {
      flexDirection: "row",
      gap: 6,
    },
    numpadKey: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    numpadKeyText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Section row
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    importButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    importButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },

    // Import modal
    importOptionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    importOptionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 3,
    },
    importOptionDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    importHint: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    importFeedback: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    importFeedbackText: {
      fontSize: 14,
      flex: 1,
      color: colors.textPrimary,
    },
    smsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      gap: 14,
    },
    smsCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    smsCardAmount: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.error,
    },
    smsCardDesc: {
      fontSize: 13,
      color: colors.textPrimary,
      marginTop: 2,
    },
    smsCardMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    smsCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    smsCheckboxSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },

  });
}
