import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WishItem } from "../../../lib/storage/types";
import { useTheme, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";

function resolveCategoryPresentation(rawCategory: string): { label: string; icon: keyof typeof Ionicons.glyphMap } {
  const normalized = rawCategory.trim().toLowerCase();
  if (normalized.startsWith("obj")) return { label: "Objeto", icon: "cube-outline" };
  if (normalized.startsWith("conc")) return { label: "Concierto", icon: "musical-notes-outline" };
  if (normalized.startsWith("gust")) return { label: "Gusto / Antojo", icon: "ice-cream-outline" };
  if (normalized.startsWith("otr")) return { label: "Otro", icon: "star-outline" };
  return { label: rawCategory, icon: "pricetag-outline" };
}

function formatAmount(value: number): string {
  return "$" + value.toLocaleString("es", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type Props = {
  item: WishItem;
  onClose: () => void;
  onOpenLink: (url: string) => void;
};

export default function WishDetailModal({ item, onClose, onOpenLink }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const category = resolveCategoryPresentation(item.category);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <AppText style={styles.headerTitle} numberOfLines={2} disableHorizontalPadding>
              {item.title}
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* Imagen */}
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imageFallback}>
                <Ionicons name="image-outline" size={48} color={colors.border} />
              </View>
            )}

            {/* Categoría */}
            <View style={styles.row}>
              <Ionicons name={category.icon} size={18} color={colors.primary} />
              <AppText style={styles.rowText} disableHorizontalPadding>
                {category.label}
              </AppText>
            </View>

            {/* Precio */}
            <View style={styles.row}>
              <Ionicons name="pricetag-outline" size={18} color={colors.success} />
              <AppText style={[styles.rowText, { fontWeight: "700", color: colors.success }]} disableHorizontalPadding>
                {item.amount !== undefined ? formatAmount(item.amount) : "Precio no especificado"}
              </AppText>
            </View>

            {/* Descripción */}
            {item.description ? (
              <View style={styles.descSection}>
                <AppText style={styles.sectionTitle} disableHorizontalPadding>
                  Descripción
                </AppText>
                <AppText style={styles.descText} disableHorizontalPadding>
                  {item.description}
                </AppText>
              </View>
            ) : null}

            {/* Enlace */}
            {item.link ? (
              <TouchableOpacity style={styles.linkRow} onPress={() => onOpenLink(item.link)}>
                <Ionicons name="link-outline" size={18} color={colors.primary} />
                <AppText style={styles.linkText} numberOfLines={2} disableHorizontalPadding>
                  {item.link}
                </AppText>
                <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}

            {/* Fecha de creación */}
            <View style={styles.row}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <AppText style={styles.rowText} disableHorizontalPadding>
                Agregado el {new Date(item.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </AppText>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      maxHeight: "80%",
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 24 : 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
      gap: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    body: {
      flexGrow: 0,
    },
    image: {
      width: "100%",
      height: 180,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    imageFallback: {
      width: "100%",
      height: 120,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    rowText: {
      fontSize: 15,
      color: colors.textPrimary,
      flex: 1,
    },
    descSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    descText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary + "0C",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
    },
    linkText: {
      flex: 1,
      fontSize: 13,
      color: colors.primary,
    },
  });
