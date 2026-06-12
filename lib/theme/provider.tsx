import { useState, useEffect, useCallback } from "react";
import React from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveTheme, setActiveTheme as storageSetActive, getPurchasedThemeIds, purchaseTheme as storagePurchase } from "../storage/themes";
import { getActiveBackground, setActiveBackground as storageSetBackground, getPurchasedBackgroundIds, purchaseBackground as storagePurchaseBg } from "../storage/backgrounds";
import { getActiveButtonColor, setActiveButtonColor as storageSetBtnColor, getPurchasedButtonColorIds, purchaseButtonColor as storagePurchaseBtnColor, claimFreePoints as storageClaimPoints, hasClaimedFreePoints } from "../storage/button-colors";
import { getActiveChartColor, setActiveChartColor as storageSetChartColor, getPurchasedChartColorIds, purchaseChartColor as storagePurchaseChartColor } from "../storage/chart-colors";
import { getActiveMovementLayer, setActiveMovementLayer as storageSetMovementLayer, getPurchasedMovementLayerIds, purchaseMovementLayer as storagePurchaseMovementLayer } from "../storage/movement-layers";
import { getActiveGlowId, setActiveGlowId as storageSetGlow, getGlowIntensity, setGlowIntensity as storageSetIntensity, getPurchasedGlowIds, purchaseGlow as storagePurchaseGlow } from "../storage/glow";
import { getThemeById, THEMES, getBackgroundById, BACKGROUNDS } from "./presets/themes";
import { LIGHT, DARK } from "./colors";
import { BUTTON_COLORS, getButtonColorById } from "./presets/button-colors";
import { CHART_COLORS, getChartColorById } from "./presets/chart-colors";
import { MOVEMENT_LAYERS, getMovementLayerById } from "./presets/movement-layers";
import { GLOW_PRESETS, getGlowById } from "./presets/glow-presets";
import { ThemeContext, ThemeMode } from "./context";
import type { ThemeColors } from "./colors";

export { LIGHT, DARK };
export type { ThemeColors, ThemeMode };

const THEME_KEY = "poinyta_theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [activeVariantId, setActiveVariantId] = useState("default");
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set(["default"]));
  const [activeBackgroundId, setActiveBackgroundId] = useState("default");
  const [purchasedBackgroundIds, setPurchasedBackgroundIds] = useState<Set<string>>(new Set(["default"]));
  const [activeButtonColorId, setActiveButtonColorId] = useState("default");
  const [purchasedButtonColorIds, setPurchasedButtonColorIds] = useState<Set<string>>(new Set(["default"]));
  const [freePointsClaimed, setFreePointsClaimed] = useState(false);
  const [activeChartColorId, setActiveChartColorId] = useState("default");
  const [purchasedChartColorIds, setPurchasedChartColorIds] = useState<Set<string>>(new Set(["default"]));
  const [movementLayerId, setMovementLayerId] = useState("none");
  const [purchasedMovementLayerIds, setPurchasedMovementLayerIds] = useState<Set<string>>(new Set(["none"]));
  const [glowId, setGlowIdState] = useState("none");
  const [glowIntensity, setGlowIntensityState] = useState(50);
  const [purchasedGlowIds, setPurchasedGlowIds] = useState<Set<string>>(new Set(["none"]));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const [themeMode, activeTheme, purchased, activeBg, purchasedBg, btnColor, purchasedBtnColors, claimed, chartColor, purchasedChartColors, activeMovement, purchasedMovementLayers, activeGlow, glowIntens, purchasedGlow] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          getActiveTheme(),
          getPurchasedThemeIds(),
          getActiveBackground(),
          getPurchasedBackgroundIds(),
          getActiveButtonColor(),
          getPurchasedButtonColorIds(),
          hasClaimedFreePoints(),
          getActiveChartColor(),
          getPurchasedChartColorIds(),
          getActiveMovementLayer(),
          getPurchasedMovementLayerIds(),
          getActiveGlowId(),
          getGlowIntensity(),
          getPurchasedGlowIds(),
        ]);
        if (!isMounted) return;

        if (themeMode === "light" || themeMode === "dark" || themeMode === "system") {
          setModeState(themeMode);
        }
        setActiveVariantId(activeTheme);
        setPurchasedIds(purchased);
        setActiveBackgroundId(activeBg);
        setPurchasedBackgroundIds(purchasedBg);
        setActiveButtonColorId(btnColor);
        setPurchasedButtonColorIds(purchasedBtnColors);
        setFreePointsClaimed(claimed);
        setActiveChartColorId(chartColor);
        setPurchasedChartColorIds(purchasedChartColors);
        setMovementLayerId(activeMovement);
        setPurchasedMovementLayerIds(purchasedMovementLayers);
        setGlowIdState(activeGlow);
        setGlowIntensityState(glowIntens);
        setPurchasedGlowIds(purchasedGlow);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    };

    hydrate();

    return () => { isMounted = false; };
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await AsyncStorage.setItem(THEME_KEY, m);
  };

  const equipTheme = useCallback(async (id: string) => {
    setActiveVariantId(id);
    await storageSetActive(id);
  }, []);

  const purchaseTheme = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchase(id, cost);
    if (result.success) {
      const fresh = await getPurchasedThemeIds();
      setPurchasedIds(fresh);
    }
    return result;
  }, []);

  const refreshPurchased = useCallback(async () => {
    const fresh = await getPurchasedThemeIds();
    setPurchasedIds(fresh);
  }, []);

  const equipBackground = useCallback(async (id: string) => {
    setActiveBackgroundId(id);
    await storageSetBackground(id);
  }, []);

  const purchaseBackground = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchaseBg(id, cost);
    if (result.success) {
      const fresh = await getPurchasedBackgroundIds();
      setPurchasedBackgroundIds(fresh);
    }
    return result;
  }, []);

  const refreshPurchasedBackgrounds = useCallback(async () => {
    const fresh = await getPurchasedBackgroundIds();
    setPurchasedBackgroundIds(fresh);
  }, []);

  const setButtonColor = useCallback(async (id: string) => {
    setActiveButtonColorId(id);
    await storageSetBtnColor(id);
  }, []);

  const purchaseButtonColor = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchaseBtnColor(id, cost);
    if (result.success) {
      const fresh = await getPurchasedButtonColorIds();
      setPurchasedButtonColorIds(fresh);
    }
    return result;
  }, []);

  const claimFreePoints = useCallback(async () => {
    await storageClaimPoints();
    setFreePointsClaimed(true);
  }, []);

  const refreshPurchasedButtonColors = useCallback(async () => {
    const fresh = await getPurchasedButtonColorIds();
    setPurchasedButtonColorIds(fresh);
  }, []);

  const setChartColor = useCallback(async (id: string) => {
    setActiveChartColorId(id);
    await storageSetChartColor(id);
  }, []);

  const purchaseChartColorAction = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchaseChartColor(id, cost);
    if (result.success) {
      const fresh = await getPurchasedChartColorIds();
      setPurchasedChartColorIds(fresh);
    }
    return result;
  }, []);

  const refreshPurchasedChartColors = useCallback(async () => {
    const fresh = await getPurchasedChartColorIds();
    setPurchasedChartColorIds(fresh);
  }, []);

  const setMovementLayer = useCallback(async (id: string) => {
    setMovementLayerId(id);
    await storageSetMovementLayer(id);
  }, []);

  const purchaseMovementLayerAction = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchaseMovementLayer(id, cost);
    if (result.success) {
      const fresh = await getPurchasedMovementLayerIds();
      setPurchasedMovementLayerIds(fresh);
    }
    return result;
  }, []);

  const refreshPurchasedMovementLayers = useCallback(async () => {
    const fresh = await getPurchasedMovementLayerIds();
    setPurchasedMovementLayerIds(fresh);
  }, []);

  const setGlow = useCallback(async (id: string) => {
    setGlowIdState(id);
    await storageSetGlow(id);
  }, []);

  const setGlowIntensityAction = useCallback(async (value: number) => {
    setGlowIntensityState(value);
    await storageSetIntensity(value);
  }, []);

  const purchaseGlowAction = useCallback(async (id: string, cost: number) => {
    const result = await storagePurchaseGlow(id, cost);
    if (result.success) {
      const fresh = await getPurchasedGlowIds();
      setPurchasedGlowIds(fresh);
    }
    return result;
  }, []);

  const refreshPurchasedGlow = useCallback(async () => {
    const fresh = await getPurchasedGlowIds();
    setPurchasedGlowIds(fresh);
  }, []);

  const effective = mode === "system" ? (systemScheme ?? "light") : mode;
  const isDark = effective === "dark";
  const variant = getThemeById(activeVariantId);
  const overrides = isDark ? variant.darkOverrides : variant.lightOverrides;
  const btnColorPreset = getButtonColorById(activeButtonColorId);
  const btnOverrides = btnColorPreset && btnColorPreset.primary ? { primary: btnColorPreset.primary, primaryActive: btnColorPreset.primaryActive } : {};
  const colors: ThemeColors = { ...(isDark ? DARK : LIGHT), ...overrides, ...btnOverrides };
  const chartPreset = getChartColorById(activeChartColorId);
  if (chartPreset?.positive) {
    colors.chartPositive = chartPreset.positive;
    colors.chartNegative = chartPreset.negative;
  }

  if (!isHydrated) return <></>;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        mode,
        isDark,
        setMode,
        activeVariantId,
        purchasedIds,
        equipTheme,
        purchaseTheme,
        refreshPurchased,
        activeBackgroundId,
        purchasedBackgroundIds,
        equipBackground,
        purchaseBackground,
        refreshPurchasedBackgrounds,
        activeButtonColorId,
        purchasedButtonColorIds,
        setButtonColor,
        purchaseButtonColor,
        claimFreePoints,
        freePointsClaimed,
        refreshPurchasedButtonColors,
        allButtonColors: BUTTON_COLORS,
        activeChartColorId,
        purchasedChartColorIds,
        setChartColor,
        purchaseChartColor: purchaseChartColorAction,
        refreshPurchasedChartColors,
        allChartColors: CHART_COLORS,
        movementLayerId,
        purchasedMovementLayerIds,
        setMovementLayer,
        purchaseMovementLayer: purchaseMovementLayerAction,
        refreshPurchasedMovementLayers,
        allMovementLayers: MOVEMENT_LAYERS,
        glowId,
        glowIntensity,
        purchasedGlowIds,
        setGlow,
        setGlowIntensity: setGlowIntensityAction,
        purchaseGlow: purchaseGlowAction,
        refreshPurchasedGlow,
        allGlowPresets: GLOW_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
