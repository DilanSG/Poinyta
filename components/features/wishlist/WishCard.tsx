import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WishItem } from "../../../lib/storage/types";
import { useTheme, useGlow, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";

type Props = {
  item: WishItem;
  onPress: (item: WishItem) => void;
  onDelete: (id: string) => void;
  onOpenLink: (url: string) => void;
  onEdit: (item: WishItem) => void;
};

type CategoryPresentation = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Normaliza categorias heredadas o truncadas a los valores canonicos.
// Ej: "obj..." -> "objeto", "conc..." -> "concierto", etc.
function normalizeWishCategory(rawCategory: string): string {
  const normalized = rawCategory.trim().toLowerCase();

  if (normalized.startsWith("obj")) return "objeto";
  if (normalized.startsWith("conc")) return "concierto";
  if (normalized.startsWith("gust")) return "gusto";
  if (normalized.startsWith("otr")) return "otro";

  return normalized;
}

// Convierte cualquier categoria libre en etiqueta legible para UI.
// Reemplaza guiones/guion_bajo por espacios, capitaliza palabras de >2 letras.
function formatCategoryLabel(rawCategory: string): string {
  const compact = rawCategory.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!compact) return "Objeto";

  return compact
    .split(" ")
    .map((word) => {
      if (word.length <= 2) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

// Mapea categoria a par (etiqueta, icono) para mostrar en la UI.
// Soporta alias en ingles y datos heredados de versiones anteriores.
function resolveCategoryPresentation(rawCategory: string): CategoryPresentation {
  const normalized = normalizeWishCategory(rawCategory);

  if (normalized === "objeto") {
    return { label: "Objeto", icon: "cube-outline" };
  }

  if (normalized === "concierto") {
    return { label: "Concierto", icon: "musical-notes-outline" };
  }

  if (normalized === "gusto") {
    return { label: "Gusto / Antojo", icon: "ice-cream-outline" };
  }

  if (normalized === "otro") {
    return { label: "Otro", icon: "star-outline" };
  }

  return {
    label: formatCategoryLabel(rawCategory),
    icon: "pricetag-outline",
  };
}

// Formatea un numero como precio en pesos chilenos (ej. "$12.345").
function formatAmount(value: number): string {
  return "$" + value.toLocaleString("es", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Tarjeta para renderizar un articulo individual de la Wishlist.
// Long-press abre edicion, trash elimina, y el boton "Ver enlace" abre el link.
export function WishCard({ item, onPress, onDelete, onOpenLink, onEdit }: Props) {
  const colors = useTheme();
  const { glowStyle } = useGlow();
  const styles = getStyles(colors);
  const category = resolveCategoryPresentation(item.category);

  return (
      <Pressable style={[styles.card, glowStyle]} onPress={() => onPress(item)} onLongPress={() => onEdit(item)} delayLongPress={320}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <Ionicons name={category.icon} size={14} color={colors.primary} />
            <Text style={styles.categoryLabel}>{`${category.label} `}</Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.fallbackImage}>
              <Ionicons name="image-outline" size={32} color={colors.border} />
            </View>
          )}

          <View style={styles.productDetails}>
            <AppText style={styles.title} numberOfLines={2}>
              {item.title}
            </AppText>
            {item.description ? (
              <AppText style={styles.description} numberOfLines={2}>
                {item.description}
              </AppText>
            ) : null}
            <View style={styles.priceRow}>
              {item.amount !== undefined ? (
                <AppText style={styles.price}>{formatAmount(item.amount)}</AppText>
              ) : (
                <AppText style={styles.noPrice}>Precio no especificado</AppText>
              )}

              {item.link ? (
                <TouchableOpacity onPress={() => onOpenLink(item.link)} style={styles.linkButton}>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <AppText style={styles.linkButtonText}>Ver enlace</AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      marginBottom: 16,
      padding: 16,
    },
    cardHeader: {
      position: "relative",
      flexDirection: "row",
      alignItems: "flex-start",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
      marginBottom: 12,
      minHeight: 24,
    },
    categoryInfo: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingRight: 36,
    },
    categoryLabel: {
      marginLeft: 6,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
      paddingRight: 6,
      flexShrink: 0,
    },
    deleteButton: {
      position: "absolute",
      right: 0,
      top: -2,
      padding: 4,
      alignSelf: "center",
    },
    cardContent: {
      flexDirection: "row",
    },
    productImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fallbackImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    productDetails: {
      flex: 1,
      marginLeft: 12,
      justifyContent: "space-between",
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    price: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.success,
      flexShrink: 1,
    },
    noPrice: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: "italic",
      flexShrink: 1,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexShrink: 0,
    },
    linkButtonText: {
      fontSize: 12,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: "500",
    },
  });
export default WishCard;
