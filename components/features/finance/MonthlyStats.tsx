import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";
import GlowView from "../../ui/GlowView";

type Props = {
  income: number;
  expenses: number;
  balance: number;
};

// Tarjeta de resumen de estadísticas financieras mensuales.
export function MonthlyStats({ income, expenses, balance }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <GlowView cardRadius={16} style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.headerLabel}>Balance Mensual</AppText>
        <AppText style={[styles.balanceValue, balance >= 0 ? styles.positive : styles.negative]}>
          ${balance.toLocaleString("es", { minimumFractionDigits: 0 })}
        </AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.col}>
          <AppText style={styles.colLabel}>Ingresos</AppText>
          <AppText style={[styles.colValue, styles.positive]}>
            +${income.toLocaleString("es", { minimumFractionDigits: 0 })}
          </AppText>
        </View>
        <View style={styles.col}>
          <AppText style={styles.colLabel}>Gastos</AppText>
          <AppText style={[styles.colValue, styles.negative]}>
            -${expenses.toLocaleString("es", { minimumFractionDigits: 0 })}
          </AppText>
        </View>
      </View>
    </GlowView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      alignItems: "stretch",
      width: "100%",
      paddingBottom: 8,
    },
    headerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
    },
    balanceValue: {
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 4,
      textAlign: "center",
      width: "100%",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    col: {
      flex: 1,
      alignItems: "stretch",
    },
    colLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
    },
    colValue: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 2,
      textAlign: "center",
      width: "100%",
    },
    positive: {
      color: colors.chartPositive || colors.success,
    },
    negative: {
      color: colors.chartNegative || colors.error,
    },
  });
export default MonthlyStats;
