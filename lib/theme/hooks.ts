import { useContext } from "react";
import { ThemeContext } from "./context";
import { THEMES, getThemeById, BACKGROUNDS, getBackgroundById } from "./presets/themes";
import { getButtonColorById } from "./presets/button-colors";
import { getGlowById } from "./presets/glow-presets";
import type { ThemeColors } from "./colors";

export function useTheme(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useThemeMode() {
  const { mode, isDark, setMode } = useContext(ThemeContext);
  return { mode, isDark, setMode };
}

export function useThemeShop() {
  const { activeVariantId, purchasedIds, equipTheme, purchaseTheme, refreshPurchased } =
    useContext(ThemeContext);
  return { activeVariantId, purchasedIds, equipTheme, purchaseTheme, refreshPurchased, allThemes: THEMES };
}

export function useBackgroundShop() {
  const { activeBackgroundId, purchasedBackgroundIds, equipBackground, purchaseBackground, refreshPurchasedBackgrounds } =
    useContext(ThemeContext);
  return {
    activeBackgroundId,
    purchasedBackgroundIds,
    equipBackground,
    purchaseBackground,
    refreshPurchasedBackgrounds,
    allBackgrounds: BACKGROUNDS,
  };
}

export function useButtonColorShop() {
  const { activeButtonColorId, purchasedButtonColorIds, setButtonColor, purchaseButtonColor, claimFreePoints, freePointsClaimed, refreshPurchasedButtonColors, allButtonColors } =
    useContext(ThemeContext);
  return { activeButtonColorId, purchasedButtonColorIds, setButtonColor, purchaseButtonColor, claimFreePoints, freePointsClaimed, refreshPurchasedButtonColors, allButtonColors };
}

export function useChartColorShop() {
  const { activeChartColorId, purchasedChartColorIds, setChartColor, purchaseChartColor, refreshPurchasedChartColors, allChartColors } =
    useContext(ThemeContext);
  return { activeChartColorId, purchasedChartColorIds, setChartColor, purchaseChartColor, refreshPurchasedChartColors, allChartColors };
}

export function useMovementLayerShop() {
  const { movementLayerId, purchasedMovementLayerIds, setMovementLayer, purchaseMovementLayer, refreshPurchasedMovementLayers, allMovementLayers } =
    useContext(ThemeContext);
  return { movementLayerId, purchasedMovementLayerIds, setMovementLayer, purchaseMovementLayer, refreshPurchasedMovementLayers, allMovementLayers };
}

export function useMovementLayer() {
  const { movementLayerId, allMovementLayers } = useContext(ThemeContext);
  return { movementLayerId, allMovementLayers };
}

export function useGlowShop() {
  const { glowId, glowIntensity, purchasedGlowIds, setGlow, setGlowIntensity, purchaseGlow, refreshPurchasedGlow, allGlowPresets } =
    useContext(ThemeContext);
  return { glowId, glowIntensity, purchasedGlowIds, setGlow, setGlowIntensity, purchaseGlow, refreshPurchasedGlow, allGlowPresets };
}

export function useGlow() {
  const { glowId, glowIntensity, activeButtonColorId, colors } = useContext(ThemeContext);
  const preset = getGlowById(glowId);
  let glowColor = preset?.color ?? "transparent";
  if (glowId === "auto") {
    const btnColor = getButtonColorById(activeButtonColorId);
    glowColor = btnColor?.primary || colors.primary;
  }
  const active = glowId !== "none" && glowIntensity > 0;
  const v = glowIntensity / 100;
  const glowStyle = active
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08 + v * 0.22,
        shadowRadius: 2 + v * 6,
        elevation: v > 0 ? 3 + v * 4 : 0,
      }
    : {};
  return {
    glowColor,
    glowIntensity,
    active,
    glowStyle,
  };
}

export function useActiveBackgroundVariant(): number {
  const { activeBackgroundId } = useContext(ThemeContext);
  return getBackgroundById(activeBackgroundId).variant;
}

export function useActiveBackgroundId(): string {
  return useContext(ThemeContext).activeBackgroundId;
}
