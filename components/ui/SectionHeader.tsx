import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../lib/theme";
import AppText from "./AppText";

type Props = {
  title: string;
};

// Componente simple para cabeceras de sección con estilo unificado.
export function SectionHeader({ title }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
  });
export default SectionHeader;
