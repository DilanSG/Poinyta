import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../lib/theme";
import AppText from "./AppText";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

// Componente genérico para renderizar un template visual cuando un listado está vacío.
export function EmptyState({ icon, title, subtitle }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.border} />
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      marginTop: 20,
      width: "100%",
    },
    title: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500",
      marginTop: 12,
      textAlign: "center",
      width: "100%",
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: "center",
      width: "100%",
    },
  });
export default EmptyState;
