import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "../../../lib/storage/types";
import { useTheme, useGlow, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";

type Props = {
  item: Transaction;
  onPress: (item: Transaction) => void;
};

// Formatea una fecha ISO como "28 may · 14:30". Recibe cadena ISO 8601 de la fecha.
// Retorna texto legible con día, mes abreviado y hora.
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = date.toLocaleString("es", { month: "short" });
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} · ${h}:${m}`;
}

// Tarjeta individual de un movimiento financiero. Al presionarla abre el modal de edición.
// Muestra tipo, monto, descripción, categoría y fecha/hora de registro.
export function TransactionCard({ item, onPress }: Props) {
  const colors = useTheme();
  const { glowStyle } = useGlow();
  const styles = getStyles(colors);
  const isIncome = item.type === "income";

  return (
      <TouchableOpacity style={[styles.card, glowStyle]} onPress={() => onPress(item)} activeOpacity={0.7}>
        <View style={[styles.iconContainer, isIncome ? styles.incomeIcon : styles.expenseIcon]}>
          <Ionicons
            name={isIncome ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
            size={24}
            color={isIncome ? colors.chartPositive || colors.success : colors.chartNegative || colors.error}
          />
        </View>

        <View style={styles.content}>
          <AppText style={styles.description} numberOfLines={1}>
            {item.description || item.category}
          </AppText>
          <AppText style={styles.meta} numberOfLines={1}>
            {item.category} · {formatDateTime(item.date)}
          </AppText>
        </View>

        <View style={styles.right}>
          <AppText style={[styles.amount, isIncome ? styles.incomeText : styles.expenseText]} numberOfLines={1}>
            {isIncome ? "+" : "-"}${item.amount.toLocaleString("es", { minimumFractionDigits: 0 })}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
    incomeIcon: {
      borderColor: (colors.chartPositive || colors.success) + "40",
      backgroundColor: (colors.chartPositive || colors.success) + "10",
    },
    expenseIcon: {
      borderColor: (colors.chartNegative || colors.error) + "40",
      backgroundColor: (colors.chartNegative || colors.error) + "10",
    },
    content: {
      flex: 1,
      marginLeft: 12,
    },
    description: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    meta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    right: {
      alignItems: "flex-end",
      flexShrink: 0,
      maxWidth: "50%",
    },
    amount: {
      fontSize: 15,
      fontWeight: "bold",
      flexShrink: 1,
    },
    incomeText: {
      color: colors.chartPositive || colors.success,
    },
    expenseText: {
      color: colors.chartNegative || colors.error,
    },
  });

export default TransactionCard;

