import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, type ThemeColors } from "../../lib/theme";
import AppText from "./AppText";
import GlowView from "./GlowView";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

type AlertContextType = {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert debe usarse dentro de un AlertProvider");
  return ctx;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const configRef = useRef<AlertConfig | null>(null);
  const [, forceRender] = useState(0);

  const showAlert: AlertContextType["showAlert"] = useCallback(
    (title, message?, buttons?) => {
      configRef.current = { title, message, buttons };
      forceRender((n) => n + 1);
      setVisible(true);
    },
    []
  );

  // setTimeout(fn, 0) asegura que el modal se cierre visualmente antes de
  // ejecutar la accion del boton. Esto evita que mutaciones de estado
  // (ej. borrar datos) ocurran mientras el modal aun esta en la jerarquia
  // de vistas, lo que podria causar errores de render en React Native.
  const handleButtonPress = useCallback((btn: AlertButton) => {
    setVisible(false);
    const fn = btn.onPress;
    configRef.current = null;
    setTimeout(fn ?? (() => {}), 0);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    configRef.current = null;
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        visible={visible}
        config={configRef.current}
        onButtonPress={handleButtonPress}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
}

function AlertModal({
  visible,
  config,
  onButtonPress,
  onClose,
}: {
  visible: boolean;
  config: AlertConfig | null;
  onButtonPress: (btn: AlertButton) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const styles = getStyles(colors);

  if (!config) return null;

  const { title, message, buttons } = config;
  const hasButtons = buttons && buttons.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlowView cardRadius={20} style={styles.card}>
          <AppText style={styles.title}>{title}</AppText>
          {message ? <AppText style={styles.message}>{message}</AppText> : null}
          <View style={hasButtons ? styles.actions : styles.singleAction}>
            {hasButtons
              ? buttons!.map((btn, i) => {
                  const isDefault = !btn.style || btn.style === "default";
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.btn,
                        isDefault && styles.btnDefault,
                        isCancel && styles.btnCancel,
                        isDestructive && styles.btnDestructive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => onButtonPress(btn)}
                    >
                      <AppText
                        style={[
                          styles.btnText,
                          isDefault && styles.btnTextDefault,
                          isCancel && styles.btnTextCancel,
                          isDestructive && styles.btnTextDestructive,
                        ]}
                      >
                        {btn.text}
                      </AppText>
                    </TouchableOpacity>
                  );
                })
              : (
                <TouchableOpacity
                  style={[styles.btn, styles.btnDefault]}
                  activeOpacity={0.7}
                  onPress={onClose}
                >
                  <AppText style={[styles.btnText, styles.btnTextDefault]}>OK</AppText>
                </TouchableOpacity>
              )}
          </View>
        </GlowView>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 4,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    singleAction: {
      marginTop: 12,
      flexDirection: "row",
    },
    btn: {
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    btnDefault: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    btnCancel: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnDestructive: {
      flex: 1,
      backgroundColor: colors.error,
    },
    btnText: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      width: "100%",
    },
    btnTextDefault: {
      color: "#FAF8F5",
    },
    btnTextCancel: {
      color: colors.textSecondary,
    },
    btnTextDestructive: {
      color: "#FAF8F5",
    },
  });
