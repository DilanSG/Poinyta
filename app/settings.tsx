import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import Svg, { Polygon, Circle, Ellipse, Rect, Path, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  clearAllData,
  getSyncConfig,
  setSyncConfig,
  syncFromN8n,
  getUserName,
  setUserName,
  getUserPoints,
  awardPoints,
} from "../lib/storage";
import { useTheme, useThemeMode, useThemeShop, useBackgroundShop, useButtonColorShop, useChartColorShop, useMovementLayerShop, useGlowShop, useGlow, ThemeColors, ThemeMode } from "../lib/theme";
import { getThemePreviewColors } from "../lib/theme/presets/themes";
import { APP_INFO } from "../constants";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import AppText from "../components/ui/AppText";
import GlowView from "../components/ui/GlowView";
import { useAlert } from "../components/ui/AlertModal";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "light", label: "Claro", icon: "sunny" },
  { value: "system", label: "Sistema", icon: "contrast" },
  { value: "dark", label: "Oscuro", icon: "moon" },
];

export default function SettingsScreen() {
  const colors = useTheme();
  const { mode, setMode, isDark } = useThemeMode();
  const { activeVariantId, purchasedIds, equipTheme, purchaseTheme, refreshPurchased, allThemes } = useThemeShop();
  const {
    activeBackgroundId,
    purchasedBackgroundIds,
    equipBackground,
    purchaseBackground: purchaseBg,
    refreshPurchasedBackgrounds,
    allBackgrounds,
  } = useBackgroundShop();
  const { activeButtonColorId, purchasedButtonColorIds, setButtonColor, purchaseButtonColor, claimFreePoints, freePointsClaimed, refreshPurchasedButtonColors, allButtonColors } = useButtonColorShop();
  const chart = useChartColorShop();
  const { showAlert } = useAlert();
  const movement = useMovementLayerShop();
  const glow = useGlowShop();
  const glowColor = (id: string) =>
    id === "auto" ? colors.primary : glow.allGlowPresets.find((g) => g.id === id)?.color || colors.primary;
  const activeBtnPreset = allButtonColors.find((b) => b.id === activeButtonColorId);
  const activeBtnColorValue = activeBtnPreset?.primary || colors.primary;
  const { glowStyle } = useGlow();
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const MOVEMENT_ICON: Record<string, string> = {
    none: "close-circle-outline",
    temblor: "pulse",
    marea: "water",
    cabeceo: "arrow-undo-outline",
    respiro: "swap-vertical",
    vagar: "compass",
    zoom: "search",
    elastico: "expand",
    balanceo: "swap-horizontal",
    onda: "options",
    latido: "heart",
    girar: "reload-outline",
    flotar: "leaf-outline",
    rebote: "arrow-up-circle-outline",
    pendulo: "barbell-outline",
  };
  const hasActiveProps =
    activeVariantId !== "default" ||
    (activeBackgroundId && activeBackgroundId !== "flat") ||
    mode === "light" || mode === "dark" ||
    activeButtonColorId !== "default" ||
    chart.activeChartColorId !== "default" ||
    movement.movementLayerId !== "none" ||
    glow.glowId !== "none";

  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const CARD_GAP = 8;
  const SIDE_PADDING = 12;
  const CARD_W = (SCREEN_WIDTH - SIDE_PADDING * 2 - CARD_GAP * 4) / 5;
  const COLOR_CARD_SIZE = (SCREEN_WIDTH - 24 - 48) / 7;
  const CHART_CARD_SIZE = (SCREEN_WIDTH - 24 - 24) / 5;

  const styles = getStyles(colors, COLOR_CARD_SIZE, CHART_CARD_SIZE);

  const [syncUrl, setSyncUrl] = useState("");
  const [syncKey, setSyncKey] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [shopVisible, setShopVisible] = useState(false);
  const [shopPoints, setShopPoints] = useState(0);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [trackWidth, setTrackWidth] = useState(200);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    themes: false,
    backgrounds: false,
    colors: false,
    chartColors: false,
    movement: false,
    glow: false,
  });
  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const openShop = useCallback(async () => {
    const pts = await getUserPoints();
    setShopPoints(pts);
    setShopVisible(true);
  }, []);

  function getConfigSnapshot() {
    return {
      theme: activeVariantId,
      background: activeBackgroundId,
      buttonColor: activeButtonColorId,
      chartColor: chart.activeChartColorId,
      movementLayer: movement.movementLayerId,
      glow: glow.glowId,
      glowIntensity: glow.glowIntensity,
      themeMode: mode,
    };
  }

  async function openFeedback() {
    setFeedbackText("");
    setFeedbackVisible(true);
  }

  async function handleSendFeedback() {
    const db = (await import("../lib/storage/db")).getDb();
    const hash = JSON.stringify(getConfigSnapshot());

    // Verificar si ya se reporto esta configuracion
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'reported_configs'"
    );
    let hashes: string[] = [];
    if (row?.value) {
      try { hashes = JSON.parse(row.value); } catch {}
    }
    if (hashes.includes(hash)) {
      Alert.alert("Ya reportaste este problema", "Esta configuración ya fue reportada anteriormente. Gracias por tu ayuda.");
      setFeedbackVisible(false);
      return;
    }

    const url = process.env.EXPO_PUBLIC_REPORT_URL ?? "";
    const key = process.env.EXPO_PUBLIC_REPORT_KEY ?? "";
    if (!url || !key) {
      Alert.alert(
        "Variables de entorno no configuradas",
        "Define EXPO_PUBLIC_REPORT_URL y EXPO_PUBLIC_REPORT_KEY en el archivo .env"
      );
      return;
    }

    setSendingFeedback(true);

    try {
      const desc = feedbackText.trim() || "(sin descripción)";
      const snapshot = getConfigSnapshot();
      const res = await fetch(`${url.replace(/\/+$/, "")}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ description: desc, config: snapshot }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      // Guardar hash y otorgar puntos
      hashes.push(hash);
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('reported_configs', ?)",
        JSON.stringify(hashes)
      );
      await awardPoints(10);
      const pts = await getUserPoints();
      setShopPoints(pts);

      setSendingFeedback(false);
      setFeedbackVisible(false);
      Alert.alert("¡Gracias!", "Has recibido 10 puntos por tu reporte.");
    } catch (e: any) {
      setSendingFeedback(false);
      Alert.alert("Error al enviar", e.message || "No se pudo enviar el reporte. Verifica que el bridge esté corriendo.");
    }
  }

  const handlePurchase = async (themeId: string, cost: number) => {
    setBuyingId(themeId);
    const result = await purchaseTheme(themeId, cost);
    setBuyingId(null);
    if (result.success) {
      const pts = await getUserPoints();
      setShopPoints(pts);
    } else {
      showAlert("Error", result.reason || "No se pudo completar la compra.");
    }
  };

  const handleEquip = async (themeId: string) => {
    await equipTheme(themeId);
  };

  useEffect(() => {
    getSyncConfig().then(({ url, key }) => {
      setSyncUrl(url);
      setSyncKey(key);
    });
    getUserName().then((name) => {
      const value = name ?? "";
      setSavedName(value);
      setNameInput(value);
    });
  }, []);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showAlert("Atención", "El nombre no puede estar vacío.");
      return;
    }
    if (trimmed === savedName) return;
    setSavingName(true);
    try {
      await setUserName(trimmed);
      setSavedName(trimmed);
      showAlert("Listo", "Nombre actualizado.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      showAlert("Error", msg);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveSyncConfig = async () => {
    try {
      await setSyncConfig(syncUrl, syncKey);
      const hasConfig = Boolean(syncUrl.trim() || syncKey.trim());
      showAlert("Listo", hasConfig ? "Configuración guardada." : "Configuración eliminada.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      showAlert("Error", msg);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncFromN8n();
      showAlert("Sincronizado", count > 0 ? `${count} gasto(s) importados.` : "No hay gastos pendientes.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      showAlert("Error", msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = () => {
    showAlert(
      "Borrar todos los datos",
      "Esto eliminará todas tus tareas, metas y notas. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            showAlert("Listo", "Todos los datos fueron eliminados.");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <BackgroundDecor colors={colors} screenVariant={5} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Perfil */}
        <GlowView style={styles.profileSection} cardRadius={12}>
          <View style={styles.profileField}>
            <AppText style={styles.profileLabel}>Nombre de Usuario</AppText>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Usuario..."
                placeholderTextColor={colors.textSecondary}
                maxLength={20}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity
                style={[
                  styles.nameSaveBtn,
                  (savingName || !nameInput.trim() || nameInput.trim() === savedName) &&
                    styles.nameSaveBtnDisabled,
                ]}
                onPress={handleSaveName}
                disabled={savingName || !nameInput.trim() || nameInput.trim() === savedName}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={savingName ? "hourglass-outline" : "checkmark"}
                  size={18}
                  color={colors.surface}
                />
              </TouchableOpacity>
            </View>
          </View>
        </GlowView>

        {/* Personalización */}
        <TouchableOpacity style={[styles.newCard, glowStyle]} onPress={openShop} activeOpacity={0.85}>
          <View style={styles.newCardHeader}>
            <View style={styles.newCardIcon}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            </View>
            <AppText style={styles.newCardTitle}>Personalización</AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
          {hasActiveProps && <View style={styles.newCardDivider} />}
          {hasActiveProps && (
            <View style={styles.newCardGrid}>
              {activeVariantId !== "default" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>TEMA</AppText>
                <AppText style={styles.newCardValue}>
                  {allThemes.find((t) => t.id === activeVariantId)?.name ?? activeVariantId}
                </AppText>
              </View>
            )}
            {activeBackgroundId && activeBackgroundId !== "flat" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>FONDO</AppText>
                <AppText style={styles.newCardValue}>
                  {allBackgrounds.find((b) => b.id === activeBackgroundId)?.name ?? activeBackgroundId}
                </AppText>
              </View>
            )}
            {(mode === "light" || mode === "dark") && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>MODO</AppText>
                <AppText style={styles.newCardValue}>{mode === "light" ? "Claro" : "Oscuro"}</AppText>
              </View>
            )}
            {activeButtonColorId !== "default" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>COLOR</AppText>
                <AppText style={styles.newCardValue}>
                  {capitalize(activeButtonColorId)}
                </AppText>
              </View>
            )}
            {chart.activeChartColorId !== "default" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>GRÁFICA</AppText>
                <AppText style={styles.newCardValue}>
                  {chart.allChartColors.find((c) => c.id === chart.activeChartColorId)?.name ?? ""}
                </AppText>
              </View>
            )}
            {movement.movementLayerId !== "none" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>MOVIMIENTO</AppText>
                <AppText style={styles.newCardValue}>
                  {movement.allMovementLayers.find((m) => m.id === movement.movementLayerId)?.name ?? ""}
                </AppText>
              </View>
            )}
            {glow.glowId !== "none" && (
              <View style={styles.newCardCell}>
                <AppText style={styles.newCardLabel}>BRILLO</AppText>
                <AppText style={[styles.newCardValue, { color: glowColor(glow.glowId) }]}>
                  {glow.allGlowPresets.find((g) => g.id === glow.glowId)?.name ?? "Brillo"}
                </AppText>
              </View>
            )}
          </View>
            )}
        </TouchableOpacity>

        {/* Sincronización n8n */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Sincronizar con n8n</AppText>
          <GlowView style={styles.group} cardRadius={12}>
            <TextInput
              style={styles.input}
              placeholder="URL del servidor (ej: http://192.168.1.10:3001)"
              placeholderTextColor={colors.textSecondary}
              value={syncUrl}
              onChangeText={setSyncUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              style={[styles.input, styles.inputLast]}
              placeholder="API Key"
              placeholderTextColor={colors.textSecondary}
              value={syncKey}
              onChangeText={setSyncKey}
              autoCapitalize="none"
              secureTextEntry
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGhost]}
                onPress={handleSaveSyncConfig}
                activeOpacity={0.7}
              >
                <Ionicons name="save-outline" size={16} color={colors.primary} />
                <AppText style={styles.actionBtnGhostText}>Guardar</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, syncing && styles.actionBtnDisabled]}
                onPress={handleSync}
                disabled={syncing}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sync-outline"
                  size={16}
                  color={syncing ? colors.textSecondary : colors.surface}
                />
                <AppText style={[styles.actionBtnPrimaryText, syncing && { color: colors.textSecondary }]}>
                  {syncing ? "Sincronizando..." : "Sincronizar"}
                </AppText>
              </TouchableOpacity>
            </View>
          </GlowView>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Datos</AppText>
          <TouchableOpacity style={[styles.dangerBtn, glowStyle]} onPress={handleClearData} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <AppText style={styles.dangerText}>Borrar todos los datos</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerWrap}>
        <AppText style={styles.footer} numberOfLines={1}>
          Made By {APP_INFO.DEVELOPER} · {APP_INFO.MAINTAINER} · v{APP_INFO.VERSION}
        </AppText>
      </View>

      {/* Modal: Tienda de temas */}
      <Modal
        visible={shopVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShopVisible(false)}
      >
          <View style={styles.shopContainer}>
            <BackgroundDecor colors={colors} screenVariant={5} />
            <View style={styles.shopHeader}>
              <TouchableOpacity
                onPress={() => setShopVisible(false)}
                style={styles.shopBackBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <AppText style={styles.shopTitle}>Tienda</AppText>
              </View>
              <View style={styles.shopPointsBadge}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <AppText style={styles.shopPointsText}>{shopPoints}</AppText>
              </View>
            </View>

          <ScrollView contentContainerStyle={styles.shopScroll}>
            <View style={styles.shopThemeSelector}>
              {THEME_OPTIONS.map((opt) => {
                const active = mode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.shopThemeOption, active && styles.shopThemeOptionActive]}
                    onPress={() => setMode(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={13}
                      color={active ? colors.surface : colors.textSecondary}
                    />
                    <AppText style={[styles.shopThemeOptionText, active && styles.shopThemeOptionTextActive]}>
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Temas */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("themes")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Temas</AppText>
                  <AppText style={styles.accordionSub}>Cambia la paleta de colores de toda la app</AppText>
                  <AppText style={styles.accordionDesc}>
                    {allThemes.length} disponibles · Activo: {activeVariantId === "default" ? "Original" : allThemes.find((t) => t.id === activeVariantId)?.name ?? activeVariantId}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.themes ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.themes && (
              <View style={styles.shopGrid}>
                {allThemes.map((theme) => {
                  const owned = purchasedIds.has(theme.id);
                  const active = activeVariantId === theme.id;
                  const preview = getThemePreviewColors(theme.id, false);
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[styles.shopCard, { width: CARD_W }, active && styles.shopCardActive, !owned && styles.shopCardLocked]}
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (owned) {
                          await handleEquip(theme.id);
                        } else {
                          showAlert(`Comprar ${theme.name}`, `¿Desbloquear este tema por ${theme.cost} pts?`, [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Comprar", style: "default", onPress: async () => { await handlePurchase(theme.id, theme.cost); } },
                          ]);
                        }
                      }}
                    >
                      <View style={styles.swatchWrap}>
                        <View style={styles.shopSwatches}>
                          <View style={[styles.shopSwatch, { backgroundColor: preview.primary }]} />
                          <View style={[styles.shopSwatch, { backgroundColor: preview.primary + "B0" }]} />
                          <View style={[styles.shopSwatch, { backgroundColor: preview.primary + "70" }]} />
                          <View style={[styles.shopSwatch, { backgroundColor: preview.primary + "40" }]} />
                          <View style={[styles.shopSwatch, { backgroundColor: preview.primary + "1A" }]} />
                        </View>
                        {!owned && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={11} color={colors.surface} />
                            <AppText style={{ fontSize: 10, fontWeight: "700", color: colors.surface }}>{theme.cost}</AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.shopCardName}>{active ? `${theme.name} ✓` : theme.name}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Fondos */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("backgrounds")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="image-outline" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Fondos</AppText>
                  <AppText style={styles.accordionSub}>Añade patrones decorativos al fondo de la app</AppText>
                  <AppText style={styles.accordionDesc}>
                    {allBackgrounds.length} disponibles · Activo: {activeBackgroundId === "default" ? "Original" : allBackgrounds.find((b) => b.id === activeBackgroundId)?.name ?? activeBackgroundId}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.backgrounds ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.backgrounds && (
              <View style={styles.shopGrid}>
                {allBackgrounds.map((bg) => {
                  const owned = purchasedBackgroundIds.has(bg.id);
                  const active = activeBackgroundId === bg.id;
                  return (
                    <TouchableOpacity
                      key={bg.id}
                      style={[styles.shopCard, { width: CARD_W }, active && styles.shopCardActive, !owned && styles.shopCardLocked]}
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (owned) {
                          await equipBackground(bg.id);
                        } else {
                          showAlert(`Comprar ${bg.name}`, `¿Desbloquear este fondo por ${bg.cost} pts?`, [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Comprar", style: "default", onPress: async () => {
                              setBuyingId(bg.id);
                              const result = await purchaseBg(bg.id, bg.cost);
                              setBuyingId(null);
                              if (result.success) { const pts = await getUserPoints(); setShopPoints(pts); }
                              else { showAlert("Error", result.reason || "No se pudo completar la compra."); }
                            }},
                          ]);
                        }
                      }}
                    >
                      <View style={styles.swatchWrap}>
                        <View style={[styles.bgPreview, { backgroundColor: colors.primary + "18" }]}>
                          <Svg width={54} height={54} viewBox="0 0 54 54">
                            {bg.id === "circles" && (<Circle cx={27} cy={27} r={11} fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "diamonds" && (<Polygon points="18.9,13.5 35.1,13.5 40.5,24.3 27,40.5 13.5,24.3" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "triangles" && (<Polygon points="13,39 41,39 27,15" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "rings" && (<Ellipse cx={27} cy={27} rx={15} ry={9} fill="none" stroke={colors.primary} strokeWidth={3} opacity={0.5} />)}
                            {bg.id === "mixed" && (<><Circle cx={16} cy={16} r={7} fill={colors.primary} opacity={0.4} /><Rect x={30} y={10} width={14} height={14} fill={colors.primary} opacity={0.4} rx={3} /><Polygon points="19,29.1 35,29.1 27,43" fill={colors.primary} opacity={0.4} /></>)}
                            {bg.id === "dots" && (<><Circle cx={15} cy={27} r={3} fill={colors.primary} opacity={0.5} /><Circle cx={27} cy={15} r={4} fill={colors.primary} opacity={0.5} /><Circle cx={39} cy={30} r={3} fill={colors.primary} opacity={0.5} /><Circle cx={22} cy={40} r={2} fill={colors.primary} opacity={0.5} /><Circle cx={35} cy={19} r={2.5} fill={colors.primary} opacity={0.5} /></>)}
                            {bg.id === "pentagono" && (<Polygon points="27,6 44,20 38,40 16,40 10,20" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "hexagons" && (<Polygon points="27,7 44.3,17 44.3,37 27,47 9.7,37 9.7,17" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "stars" && (<Polygon points="27,8 31.3,21.1 45.1,21.1 33.9,29.2 38.2,42.4 27,34.3 15.8,42.4 20.1,29.2 8.9,21.1 22.7,21.1" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "flat" && (<></>)}
                            {bg.id === "crosses" && (<Path d="M16,16 L38,38 M38,16 L16,38" fill="none"stroke={colors.primary}strokeWidth={3.2} opacity={0.5} strokeLinecap="round" strokeLinejoin="round"/>)}
                            {bg.id === "waves" && (<Path d="M10,30 Q18,18 27,27 T44,27" fill="none" stroke={colors.primary} strokeWidth={2.5} opacity={0.5} strokeLinecap="round" />)}
                            {bg.id === "squares" && (<Rect x={16} y={16} width={22} height={22} fill={colors.primary} opacity={0.4} rx={3} />)}
                            {bg.id === "arrows" && (<G transform={`rotate(45, 27, 27)`}><Polygon points="27,12 14,42 27,32 40,42" fill={colors.primary} opacity={0.5} /></G>)}
                            {bg.id === "cylinders" && (<G transform={`rotate(45, 27, 27)`}><Rect x={19} y={12} width={16} height={30} rx={8} fill={colors.primary} opacity={0.5} /></G>)}
                            {bg.id === "heptagons" && (<Polygon points="27,5 44.2,13.3 48.4,31.9 36.5,46.8 17.5,46.8 5.6,31.9 9.8,13.3" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "octagons" && (<Polygon points="27,5 42.6,11.4 49,27 42.6,42.6 27,49 11.4,42.6 5,27 11.4,11.4" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "nonagons" && (<Polygon points="27,5 41.1,10.1 48.7,23.2 46.1,38 34.5,47.7 19.5,47.7 7.9,38 5.3,23.2 12.9,10.1" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "decagons" && (<Polygon points="27,5 39.9,9.2 47.9,20.2 47.9,33.8 39.9,44.8 27,49 14.1,44.8 6.1,33.8 6.1,20.2 14.1,9.2" fill={colors.primary} opacity={0.5} />)}
                            {bg.id === "dodecagons" && (<Polygon points="27,5 38,7.9 46.1,16 49,27 46.1,38 38,46.1 27,49 16,46.1 7.9,38 5,27 7.9,16 16,7.9" fill={colors.primary} opacity={0.5} />)}
                          </Svg>
                        </View>
                        {!owned && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={11} color={colors.surface} />
                            <AppText style={{ fontSize: 10, fontWeight: "700", color: colors.surface }}>{bg.cost}</AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.shopCardName}>{active ? `${bg.name} ` : bg.name}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Color secundario accordion */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("colors")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="color-fill-outline" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Color secundario</AppText>
                  <AppText style={styles.accordionSub}>Personaliza el tono de botones y elementos interactivos</AppText>
                  <AppText style={styles.accordionDesc}>
                    {allButtonColors.length} colores · Activo: {activeButtonColorId === "default" ? "Original" : capitalize(activeButtonColorId)}
                    {!freePointsClaimed && <> · <AppText style={{ fontSize: 10, color: colors.primary, textDecorationLine: "underline" }} onPress={async () => {
                      await claimFreePoints();
                      const pts = await getUserPoints();
                      setShopPoints(pts);
                      showAlert("+50 pts", "Has recibido 50 puntos gratis. ¡Gasta tus puntos en colores!");
                    }}>+50 pts gratis</AppText></>}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.colors ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.colors && (
              <View style={styles.colorGrid}>
                {allButtonColors.map((btn) => {
                  const owned = purchasedButtonColorIds.has(btn.id);
                  const active = activeButtonColorId === btn.id;
                  const color = btn.primary || colors.primary;
                  return (
                    <TouchableOpacity
                      key={btn.id}
                      style={[styles.colorCard, active && styles.colorCardActive, !owned && styles.shopCardLocked]}
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (owned) {
                          await setButtonColor(btn.id);
                        } else {
                          showAlert(`¿Desbloquear este color?`, `Cuesta ${btn.cost} pts`, [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Comprar", style: "default", onPress: async () => {
                              const result = await purchaseButtonColor(btn.id, btn.cost);
                              if (result.success) { const pts = await getUserPoints(); setShopPoints(pts); }
                              else { showAlert("Error", result.reason || "No se pudo completar la compra."); }
                            }},
                          ]);
                        }
                      }}
                    >
                      <View style={[styles.colorSwatch, { backgroundColor: color }]}>
                        {active && (<Ionicons name="checkmark" size={14} color={colors.surface} />)}
                        {!owned && (
                          <View style={styles.colorLockOverlay}>
                            <Ionicons name="lock-closed" size={10} color={colors.surface} />
                            <AppText style={styles.lockPriceText}>{btn.cost}</AppText>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Colores de gráficas */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("chartColors")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="bar-chart" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Colores de gráficas</AppText>
                  <AppText style={styles.accordionSub}>Define los colores de ingresos y gastos en tus gráficos</AppText>
                  <AppText style={styles.accordionDesc}>
                    {chart.allChartColors.length} pares · Activo: {chart.allChartColors.find((c) => c.id === chart.activeChartColorId)?.name ?? "Original"}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.chartColors ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.chartColors && (
              <View style={styles.colorGrid}>
                {chart.allChartColors.map((cc) => {
                  const owned = cc.cost === 0 || chart.purchasedChartColorIds.has(cc.id);
                  const active = chart.activeChartColorId === cc.id;
                  const posColor = cc.positive || colors.chartPositive || colors.success;
                  const negColor = cc.negative || colors.chartNegative || colors.error;
                  return (
                    <View key={cc.id} style={styles.chartCardWrap}>
                      <TouchableOpacity
                        style={[styles.chartCard, active && styles.colorCardActive, !owned && styles.shopCardLocked]}
                        activeOpacity={0.7}
                        onPress={async () => {
                          if (owned) {
                            await chart.setChartColor(cc.id);
                          } else {
                            showAlert(`¿Desbloquear este par?`, `Cuesta ${cc.cost} pts`, [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Comprar", style: "default", onPress: async () => {
                                const result = await chart.purchaseChartColor(cc.id, cc.cost);
                                if (result.success) {
                                  const pts = await getUserPoints();
                                  setShopPoints(pts);
                                } else {
                                  showAlert("Error", result.reason || "No se pudo completar la compra.");
                                }
                              }},
                            ]);
                          }
                        }}
                      >
                        <View style={styles.chartPairSwatch}>
                          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: negColor, borderRadius: 5 }} />
                          <View style={styles.chartDiagonalWrap}>
                            <View style={{ flex: 1, backgroundColor: posColor }} />
                            <View style={{ flex: 1 }} />
                          </View>
                        </View>
                        {active && (
                          <View style={styles.chartCheckOverlay}>
                            <Ionicons name="checkmark" size={14} color={colors.surface} />
                          </View>
                        )}
                        {!owned && (
                          <View style={styles.colorLockOverlay}>
                            <Ionicons name="lock-closed" size={10} color={colors.surface} />
                            <AppText style={styles.lockPriceText}>{cc.cost}</AppText>
                          </View>
                        )}
                      </TouchableOpacity>
                      <AppText style={styles.chartPairName} numberOfLines={1}>{cc.name}</AppText>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Capa de movimiento */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("movement")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="radio-outline" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Movimiento</AppText>
                  <AppText style={styles.accordionSub}>Animaciones sutiles para los fondos</AppText>
                  <AppText style={styles.accordionDesc}>
                    {movement.allMovementLayers.length - 1} patrones · Activo: {movement.allMovementLayers.find((m) => m.id === movement.movementLayerId)?.name ?? "Sin movimiento"}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.movement ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.movement && (
              <View style={styles.colorGrid}>
                {movement.allMovementLayers.map((m) => {
                  const owned = m.cost === 0 || movement.purchasedMovementLayerIds.has(m.id);
                  const active = movement.movementLayerId === m.id;
                  return (
                    <View key={m.id} style={styles.chartCardWrap}>
                      <TouchableOpacity
                        style={[styles.chartCard, active && styles.colorCardActive, !owned && styles.shopCardLocked]}
                        activeOpacity={0.7}
                        onPress={async () => {
                          if (owned) {
                            await movement.setMovementLayer(m.id);
                          } else {
                            showAlert(`¿Desbloquear "${m.name}"?`, `Cuesta ${m.cost} pts`, [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Comprar", style: "default", onPress: async () => {
                                const result = await movement.purchaseMovementLayer(m.id, m.cost);
                                if (result.success) {
                                  await movement.setMovementLayer(m.id);
                                  const pts = await getUserPoints();
                                  setShopPoints(pts);
                                } else {
                                  showAlert("Error", result.reason || "No se pudo completar la compra.");
                                }
                              }},
                            ]);
                          }
                        }}
                      >
                        <View style={styles.moveSwatch}>
                          <Ionicons name={MOVEMENT_ICON[m.id] as any} size={20} color={colors.primary} />
                          {!owned && (
                            <View style={styles.colorLockOverlay}>
                              <Ionicons name="lock-closed" size={10} color={colors.surface} />
                              <AppText style={styles.lockPriceText}>{m.cost}</AppText>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      <AppText style={styles.chartPairName} numberOfLines={1}>{active ? `${m.name} ` : m.name}</AppText>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Brillo */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection("glow")} activeOpacity={0.7}>
              <View style={styles.accordionLeft}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <View style={styles.accordionInfo}>
                  <AppText style={styles.accordionTitle}>Brillo</AppText>
                  <AppText style={styles.accordionSub}>Agrega un brillo decorativo para la app</AppText>
                  <AppText style={styles.accordionDesc}>
                    {glow.allGlowPresets.length} brillos · Activo: {glow.allGlowPresets.find((g) => g.id === glow.glowId)?.name ?? "Sin brillo"}
                  </AppText>
                </View>
              </View>
              <Ionicons name={expandedSections.glow ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {expandedSections.glow && (
              <>
                <View style={styles.glowGrid}>
                  {glow.allGlowPresets.map((pr) => {
                    const owned = pr.cost === 0 || glow.purchasedGlowIds.has(pr.id);
                    const active = glow.glowId === pr.id;
                    const isNone = pr.id === "none";
                    const isAuto = pr.id === "auto";
                    const rainbowColors = [colors.error, colors.warning, colors.warning, colors.success, colors.accentBlue, colors.primary, colors.error];
                    return (
                      <TouchableOpacity
                        key={pr.id}
                        style={[styles.glowCard, active && styles.glowCardActive, !owned && styles.shopCardLocked]}
                        activeOpacity={0.7}
                        onPress={async () => {
                          if (owned) {
                            await glow.setGlow(pr.id);
                          } else {
                            showAlert(`Comprar ${pr.name}`, `¿Desbloquear este brillo por ${pr.cost} pts?`, [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Comprar", style: "default", onPress: async () => {
                                const result = await glow.purchaseGlow(pr.id, pr.cost);
                                if (result.success) { const pts = await getUserPoints(); setShopPoints(pts); await glow.setGlow(pr.id); }
                                else { showAlert("Error", result.reason || "No se pudo completar la compra."); }
                              }},
                            ]);
                          }
                        }}
                      >
                        <View style={styles.glowSwatchWrap}>
                          {isAuto ? (
                            <View style={styles.glowSwatchRainbow}>
                              {rainbowColors.map((c, i) => (<View key={i} style={[styles.rainbowStripe, { backgroundColor: c }]} />))}
                            </View>
                          ) : (
                            <View style={[styles.glowSwatch, { backgroundColor: isNone ? colors.border : pr.color }, active && glow.glowId !== "none" && glow.glowIntensity > 0 && { shadowColor: pr.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }]}>
                              {active && (<Ionicons name="checkmark" size={14} color={isNone ? colors.textSecondary : colors.surface} />)}
                            </View>
                          )}
                          {!owned && (
                            <View style={styles.colorLockOverlay}>
                              <Ionicons name="lock-closed" size={10} color={colors.surface} />
                              <AppText style={styles.lockPriceText}>{pr.cost}</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={styles.glowCardName}>{pr.name}</AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {glow.glowId !== "none" && (
                  <View style={styles.intensitySection}>
                    <AppText style={styles.intensityLabel}>Intensidad: {glow.glowIntensity}%</AppText>
                    <View
                      style={styles.intensityTrack}
                      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        const pct = Math.round((e.nativeEvent.locationX / trackWidth) * 100);
                        glow.setGlowIntensity(Math.max(0, Math.min(100, pct)));
                      }}
                      onResponderMove={(e) => {
                        const pct = Math.round((e.nativeEvent.locationX / trackWidth) * 100);
                        glow.setGlowIntensity(Math.max(0, Math.min(100, pct)));
                      }}
                    >
                      <View style={[styles.intensityFill, {
                        width: `${glow.glowIntensity}%` as any,
                        backgroundColor: glowColor(glow.glowId),
                        opacity: 0.3 + (glow.glowIntensity / 100) * 0.5,
                        shadowColor: glowColor(glow.glowId),
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: (glow.glowIntensity / 100) * 0.6,
                        shadowRadius: 4 + (glow.glowIntensity / 100) * 8,
                        elevation: glow.glowIntensity > 0 ? 3 : 0,
                      }]} />
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* FAB: Reportar problema */}
          <TouchableOpacity
            style={styles.feedbackFab}
            onPress={openFeedback}
            activeOpacity={0.8}
          >
            <Ionicons name="bug-outline" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Modal: Reporte de feedback */}
          <Modal
            visible={feedbackVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setFeedbackVisible(false)}
          >
            <View style={styles.feedbackOverlay}>
              <View style={[styles.feedbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="bug-outline" size={20} color={colors.primary} />
                  <AppText style={[styles.feedbackTitle, { color: colors.textPrimary }]}>Reportar problema</AppText>
                </View>

                <TextInput
                  style={[styles.feedbackInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Describe el problema... (opcional)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />

                <View style={[styles.feedbackConfigBox, { backgroundColor: colors.background + "80", borderColor: colors.border }]}>
                  <AppText style={[styles.feedbackConfigLabel, { color: colors.textSecondary }]}>
                    Configuración actual:
                  </AppText>
                  <AppText style={[styles.feedbackConfigValue, { color: colors.textPrimary }]}>
                    {JSON.stringify(getConfigSnapshot(), null, 1)}
                  </AppText>
                </View>

                <View style={styles.feedbackActions}>
                  <TouchableOpacity
                    style={[styles.feedbackBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setFeedbackVisible(false)}
                    disabled={sendingFeedback}
                  >
                    <AppText style={[styles.feedbackBtnText, { color: colors.textPrimary }]}>Cancelar</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.feedbackBtn, styles.feedbackBtnPrimary, { backgroundColor: colors.primary }]}
                    onPress={handleSendFeedback}
                    disabled={sendingFeedback}
                  >
                    <Ionicons name="mail-outline" size={16} color="#fff" />
                    <AppText style={[styles.feedbackBtnText, { color: "#fff" }]}>
                      {sendingFeedback ? "Enviando..." : "Enviar reporte"}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(colors: ThemeColors, colorCardSize: number, chartCardSize: number) {
  const cardBg = colors.primary + "12";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: { flex: 1 },
    content: {
      padding: 16,
      paddingBottom: 16,
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 24,
      padding: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileField: { flex: 1, minWidth: 0 },
    profileLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    nameInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      color: colors.textPrimary,
    },
    nameSaveBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    nameSaveBtnDisabled: { opacity: 0.4 },
    section: { marginTop: 24 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 8,
      letterSpacing: 1,
    },
    themeSelector: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
      gap: 3,
      marginBottom: 12,
    },
    themeOption: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 9,
      gap: 4,
    },
    themeOptionActive: { backgroundColor: colors.primary },
    themeOptionText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    themeOptionTextActive: { color: colors.surface },

    // Card de personalización
    newCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    newCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
    },
    newCardIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    newCardTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    newCardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 14,
    },
    newCardGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 12,
      gap: 8,
    },
    newCardCell: {
      flex: 1,
      gap: 2,
    },
    newCardCellFull: {
      flex: 0,
      width: "100%",
    },
    newCardInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    newCardLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
      textAlign: "center",
    },
    newCardValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center",
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    // Tienda modal
    shopContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    shopHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 14,
      gap: 14,
    },
    shopBackBtn: {
      padding: 4,
    },
    shopTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    accordionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    accordionInfo: {
      gap: 1,
      flex: 1,
    },
    accordionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    accordionDesc: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    accordionSub: {
      fontSize: 10,
      fontWeight: "400",
      color: colors.textSecondary,
      opacity: 0.7,
      marginTop: 1,
    },
    shopScroll: {
      paddingBottom: 40,
    },
    shopPointsBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    shopPointsText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.warning,
    },
    feedbackFab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    feedbackOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 24,
    },
    feedbackCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 14,
      borderWidth: 1,
      padding: 20,
      gap: 16,
    },
    feedbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    feedbackTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    feedbackInput: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      fontSize: 14,
      minHeight: 100,
    },
    feedbackConfigBox: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      gap: 6,
    },
    feedbackConfigLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    feedbackConfigValue: {
      fontSize: 11,
      fontFamily: "monospace",
      lineHeight: 16,
    },
    feedbackActions: {
      flexDirection: "row",
      gap: 10,
    },
    feedbackBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "transparent",
    },
    feedbackBtnPrimary: {
      borderWidth: 0,
    },
    feedbackBtnText: {
      fontSize: 14,
      fontWeight: "600",
    },
    shopGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 8,
    },
    shopCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 6,
      alignItems: "center",
    },
    shopCardActive: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    shopCardLocked: {
      opacity: 0.5,
    },
    shopThemeSelector: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 2,
      gap: 2,
      marginHorizontal: 12,
      marginBottom: 14,
    },
    shopThemeOption: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    shopThemeOptionActive: { backgroundColor: colors.primary },
    shopThemeOptionText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    shopThemeOptionTextActive: { color: colors.surface },
    swatchWrap: {
      position: "relative",
      alignItems: "center",
    },
    shopSwatches: {
      flexDirection: "row",
      width: 60,
      height: 60,
      borderRadius: 9,
      overflow: "hidden",
    },
    shopSwatch: {
      width: 12,
      height: 60,
    },
    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    lockPriceText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.surface,
    },
    colorLockOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 5,
      backgroundColor: "transparent",
      transform: [{ translateY: -5 }],
      gap: 1,
    },
    bgPreview: {
      width: 54,
      height: 54,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      paddingTop: 8,
      gap: 6,
      paddingBottom: 40,
    },
    colorCard: {
      width: colorCardSize,
      height: colorCardSize,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "transparent",
      padding: 2,
    },
    colorCardActive: {
      borderColor: colors.primary,
    },
    chartCardWrap: {
      alignItems: "center",
      width: chartCardSize,
    },
    chartCard: {
      width: chartCardSize,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "transparent",
      padding: 2,
      alignItems: "center",
    },
    colorSwatch: {
      flex: 1,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    chartPairSwatch: {
      width: 44,
      height: 44,
      borderRadius: 5,
      overflow: "hidden",
      alignSelf: "center",
    },
    chartDiagonalWrap: {
      position: "absolute",
      top: -10,
      left: -10,
      width: 64,
      height: 64,
      transform: [{ rotate: "-45deg" }],
    },
    chartCheckOverlay: {
      position: "absolute",
      top: 2,
      right: 2,
      backgroundColor: colors.primary,
      borderRadius: 8,
      width: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    chartPairName: {
      fontSize: 9,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: "center",
      width: chartCardSize,
    },
    moveSwatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    glowGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      paddingTop: 8,
      gap: 8,
      paddingBottom: 12,
    },
    glowCard: {
      width: colorCardSize,
      backgroundColor: cardBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
      gap: 4,
      alignItems: "center",
    },
    glowCardActive: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    glowSwatchWrap: {
      position: "relative",
      alignItems: "center",
    },
    glowSwatch: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    glowSwatchRainbow: {
      width: 32,
      height: 32,
      borderRadius: 8,
      flexDirection: "row",
      overflow: "hidden",
    },
    rainbowStripe: {
      flex: 1,
    },
    glowCardName: {
      fontSize: 9,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center",
    },
    intensitySection: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      gap: 8,
    },
    intensityLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    intensityTrack: {
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border + "50",
      overflow: "hidden",
      justifyContent: "center",
    },
    intensityFill: {
      height: "100%",
      borderRadius: 12,
      opacity: 0.6,
    },
    ColorBtnPreview: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    shopCardName: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      alignSelf: "stretch",
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    input: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      fontSize: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    inputLast: { borderBottomWidth: 0 },
    actionRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
    },
    actionBtnGhost: { backgroundColor: "transparent" },
    actionBtnGhostText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    actionBtnPrimary: { backgroundColor: colors.primary },
    actionBtnPrimaryText: {
      color: colors.surface,
      fontSize: 13,
      fontWeight: "600",
    },
    actionBtnDisabled: { opacity: 0.6 },
    dangerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
    },
    dangerText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: "600",
    },
    footerWrap: {
      paddingTop: 14,
      paddingBottom: 28,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
    },
    footer: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      opacity: 0.6,
      letterSpacing: 0.3,
    },
  });
}
