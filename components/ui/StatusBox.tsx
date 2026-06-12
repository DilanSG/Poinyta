import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../lib/theme";
import AppText from "./AppText";
import GlowView from "./GlowView";

type Props = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
};

// Componente de cuadro de texto/tarjeta para reportar estados de éxito, error o información de forma visual,
// respetando las reglas de diseño del proyecto (sin emojis, bordes finos, etc.).
export default function StatusBox({ type, message, onClose }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);

  if (!message) return null;

  let iconName: keyof typeof Ionicons.glyphMap = "information-circle-outline";
  let iconColor = colors.primary;
  let cardStyle = styles.infoCard;

  if (type === "success") {
    iconName = "checkmark-circle-outline";
    iconColor = colors.success;
    cardStyle = styles.successCard;
  } else if (type === "error") {
    iconName = "alert-circle-outline";
    iconColor = colors.error;
    cardStyle = styles.errorCard;
  } else if (type === "warning") {
    iconName = "warning-outline";
    iconColor = colors.warning;
    cardStyle = styles.warningCard;
  }

  return (
    <GlowView cardRadius={10} style={[styles.card, cardStyle]}>
      <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <AppText style={styles.messageText}>{message}</AppText>
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </GlowView>
  );
}

import { TouchableOpacity } from "react-native";

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      marginVertical: 8,
    },
    successCard: {
      borderColor: colors.success,
      backgroundColor: "rgba(46, 204, 113, 0.05)",
    },
    errorCard: {
      borderColor: colors.error,
      backgroundColor: "rgba(231, 76, 60, 0.05)",
    },
    warningCard: {
      borderColor: colors.warning,
      backgroundColor: "rgba(241, 196, 15, 0.05)",
    },
    infoCard: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    icon: {
      marginRight: 8,
    },
    textContainer: {
      flex: 1,
    },
    messageText: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    closeBtn: {
      marginLeft: 8,
      padding: 2,
    },
  });
}
