import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../lib/theme";
import AppText from "./AppText";

type Props = {
  label: string;
  outline?: boolean;
};

// Chip/Badge genérico para categorizar elementos en pantalla.
export function Badge({ label, outline = false }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors, outline);

  return (
    <View style={styles.badge}>
      <AppText style={styles.text}>{label}</AppText>
    </View>
  );
}

const getStyles = (colors: ThemeColors, outline: boolean) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: outline ? "transparent" : colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    text: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: "500",
    },
  });
export default Badge;
