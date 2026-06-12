export const LIGHT = {
  primary: "#4C6A92",
  primaryActive: "#3E587A",
  accentBlue: "#7D9BB8",
  background: "#F4F1EC",
  surface: "#FAF8F5",
  border: "#D8D2C8",
  textPrimary: "#2E3440",
  textSecondary: "#667085",
  success: "#6B8F71",
  warning: "#C59B6D",
  error: "#B86A6A",
};

export const DARK = {
  primary: "#6E8FB3",
  primaryActive: "#8AA7C1",
  accentBlue: "#8AA7C1",
  background: "#1E2329",
  surface: "#2A3038",
  border: "#3D4652",
  textPrimary: "#ECE8E1",
  textSecondary: "#B0B7C3",
  success: "#6B8F71",
  warning: "#C59B6D",
  error: "#B86A6A",
};

export type ThemeColors = typeof LIGHT & {
  chartPositive?: string;
  chartNegative?: string;
};
