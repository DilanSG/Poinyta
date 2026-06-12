import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../lib/theme";
import { getUserName } from "../../lib/storage";
import AppText from "../ui/AppText";

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Menú lateral / Drawer personalizado para la navegación principal y acciones rápidas.
export default function DrawerMenu({ visible, onClose }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserNameLocal] = useState<string>("");

  useEffect(() => {
    if (!visible) return;
    getUserName().then((name) => {
      setUserNameLocal(name ?? "");
    });
  }, [visible]);

  // Navega a una ruta cerrando primero el drawer. El chequeo pathname === route
  // evita un re-render innecesario si el usuario toca la pantalla activa.
  // router.push se usa en vez de replace para mantener el historial de navegacion.
  const handleNavigate = (route: string) => {
    onClose();
    if (pathname === route) return;
    router.push(route as any);
  };

  const menuItems = [
    { label: "Balances", icon: "cash-outline" as const, route: "/finance" },
    { label: "Tareas", icon: "checkbox-outline" as const, route: "/tasks" },
    { label: "Deseos", icon: "gift-outline" as const, route: "/wishlist" },
    { label: "Notas", icon: "document-text-outline" as const, route: "/notes" },
    { label: "Metas Secuenciales", icon: "ribbon-outline" as const, route: "/goals" },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          {/* Header con perfil de usuario */}
          <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
              <View style={styles.profileText}>
                <AppText style={styles.profileGreeting} disableHorizontalPadding>
                  Hola,
                </AppText>
                <AppText
                  style={styles.profileName}
                  numberOfLines={1}
                  disableHorizontalPadding
                >
                  {userName || "Usuario"}
                </AppText>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Acceso a Inicio */}
          <TouchableOpacity
            style={[styles.menuItem, pathname === "/" && styles.activeItem]}
            onPress={() => handleNavigate("/")}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={pathname === "/" ? colors.primary : colors.textSecondary}
            />
            <AppText style={[styles.menuLabel, pathname === "/" && styles.activeLabel]}>
              Inicio
            </AppText>
          </TouchableOpacity>

          {/* Opciones de Navegación */}
          <View style={styles.menuList}>
            {menuItems.map((item) => {
              const active = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.menuItem, active && styles.activeItem]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                  <AppText style={[styles.menuLabel, active && styles.activeLabel]}>
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer - Configuraciones (Ajustes) */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.menuItem, pathname === "/settings" && styles.activeItem]}
              onPress={() => handleNavigate("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={pathname === "/settings" ? colors.primary : colors.textSecondary}
              />
              <AppText style={[styles.menuLabel, pathname === "/settings" && styles.activeLabel]}>
                Configuraciones
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      flexDirection: "row",
    },
    content: {
      width: 280,
      backgroundColor: colors.background,
      height: "100%",
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingTop: Platform.OS === "ios" ? 54 : 34,
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    profileHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    profileLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
    },
    profileGreeting: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    profileName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 1,
    },
    closeBtn: {
      padding: 6,
    },
    menuList: {
      flex: 1,
      gap: 6,
      marginTop: 6,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 10,
      gap: 12,
    },
    activeItem: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    activeLabel: {
      color: colors.primary,
      fontWeight: "600",
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      gap: 12,
    },
    themeToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
    },
    footerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
export { DrawerMenu };
