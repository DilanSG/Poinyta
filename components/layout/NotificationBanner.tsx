import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, View } from "react-native";
import { useNotifications } from "./NotificationContext";
import { useTheme, ThemeColors } from "../../lib/theme";
import AppText from "../ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import GlowView from "../ui/GlowView";

// Componente interactivo que dibuja la barra/banner animada en la parte superior si hay una notificación activa.
export default function NotificationBanner() {
  const { banner, hideBanner } = useNotifications();
  const colors = useTheme();
  const styles = getStyles(colors);
  
  // Valor animado para la posición Y
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (banner) {
      // 1. Desliza hacia abajo la alerta
      Animated.spring(translateY, {
        toValue: 40, // un poco debajo de la barra de estado
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      // 2. Desvanecer automáticamente después de 4 segundos
      const timer = setTimeout(() => {
        close();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [banner]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      hideBanner();
    });
  };

  if (!banner) return null;

  // Icono del banner por severidad
  let iconName: keyof typeof Ionicons.glyphMap = "information-circle-outline";
  let iconColor = colors.primary;
  
  if (banner.type === "success") {
    iconName = "checkmark-circle-outline";
    iconColor = colors.success;
  } else if (banner.type === "error") {
    iconName = "alert-circle-outline";
    iconColor = colors.error;
  } else if (banner.type === "warning") {
    iconName = "warning-outline";
    iconColor = colors.warning;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <GlowView cardRadius={12} style={styles.card}>
        <Ionicons name={iconName} size={24} color={iconColor} style={styles.icon} />
        <View style={styles.textContainer}>
          <AppText style={styles.message} numberOfLines={2}>
            {banner.message}
          </AppText>
        </View>
      </GlowView>
    </Animated.View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 16,
      right: 16,
      zIndex: 9999, // Arriba de todas las vistas
      elevation: 5,
    },
    card: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
    },
    icon: {
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
    },
    message: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    closeBtn: {
      marginLeft: 10,
      padding: 4,
    },
  });
}
