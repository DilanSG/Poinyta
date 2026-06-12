import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useGlow, ThemeColors } from "../lib/theme";
import { useWishlist } from "../hooks/useWishlist";
import { useAlert } from "../components/ui/AlertModal";
import { WishItem } from "../lib/storage/types";
import {
  deriveWishTitleFromLink,
  fetchLinkMetadata,
  normalizeWishlistLink,
  normalizeWishCategory,
  type LinkMetadata,
} from "../lib/storage";
import { WishCard } from "../components/features/wishlist/WishCard";
import WishDetailModal from "../components/features/wishlist/WishDetailModal";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import EmptyState from "../components/ui/EmptyState";
import AppText from "../components/ui/AppText";

type WishCategory = "objeto" | "concierto" | "gusto" | "otro";
const WISH_CATEGORIES = ["objeto", "concierto", "gusto", "otro"] as const;

const WISH_CATEGORY_LABELS: Record<WishCategory, string> = {
  objeto: "Objeto",
  concierto: "Concierto",
  gusto: "Gusto",
  otro: "Otro",
};

const WISH_CATEGORY_ICONS: Record<WishCategory, keyof typeof Ionicons.glyphMap> = {
  objeto: "cube-outline",
  concierto: "musical-notes-outline",
  gusto: "ice-cream-outline",
  otro: "star-outline",
};

// Sugiere una categoría a partir de texto o URL del deseo.
function inferWishCategory(text: string): WishCategory {
  const normalized = text.toLowerCase();
  if (
    normalized.includes("ticket") ||
    normalized.includes("entrada") ||
    normalized.includes("concierto") ||
    normalized.includes("recital") ||
    normalized.includes("show") ||
    normalized.includes("festival")
  ) {
    return "concierto";
  }

  if (
    normalized.includes("comida") ||
    normalized.includes("restaurante") ||
    normalized.includes("café") ||
    normalized.includes("anticipo") ||
    normalized.includes("gusto") ||
    normalized.includes("brunch")
  ) {
    return "gusto";
  }

  return "objeto";
}

// Convierte texto libre en numero admitiendo comas o puntos como separador decimal.
// Heuristicas:
//   - si aparecen ambos (ej. "1.234,56") se usa el ultimo como decimal.
//   - si aparece solo una coma/punto va seguido de 1-2 digitos -> decimal.
//   - en cualquier otro caso se interpreta como separador de miles y se elimina.
function parseAmountInput(rawValue: string): number | undefined {
  const cleaned = rawValue
    .replace(/\s|\u00A0/g, "")
    .replace(/[^\d.,]/g, "")
    .trim();
  if (!cleaned) return undefined;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  } else if (lastDot >= 0) {
    normalized = /\.\d{1,2}$/.test(cleaned) ? cleaned.replace(/,/g, "") : cleaned.replace(/\./g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

// Pantalla de Lista de Deseos (Wishlist) con carga rápida de metadatos de enlaces de compras.
export default function WishlistScreen() {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { glowStyle } = useGlow();

  const { items, addWishItem, updateWishItem, deleteWishItem } = useWishlist();
  const { showAlert } = useAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Campos para el formulario
  const [linkInput, setLinkInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<WishCategory>("objeto");

  const [viewingItem, setViewingItem] = useState<WishItem | null>(null);
  const isEditing = editingItemId !== null;

  // Limpia el formulario del modal después de guardar o cancelar una carga.
  const resetForm = () => {
    setLinkInput("");
    setTitleInput("");
    setAmountInput("");
    setDescInput("");
    setImageInput("");
    setCategoryInput("objeto");
    setEditingItemId(null);
  };

  // Abre el modal para crear un nuevo deseo.
  const handleOpenCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  // Cierra el modal de wishlist restaurando el estado del formulario.
  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm();
  };

  // Carga en el formulario un deseo existente para editarlo.
  const handleStartEdit = (item: WishItem) => {
    const rawCategory = normalizeWishCategory(item.category ?? "");
    const nextCategory = WISH_CATEGORIES.includes(rawCategory as WishCategory)
      ? (rawCategory as WishCategory)
      : "objeto";

    setEditingItemId(item.id);
    setLinkInput(item.link ?? "");
    setTitleInput(item.title);
    setAmountInput(item.amount !== undefined ? String(item.amount) : "");
    setDescInput(item.description ?? "");
    setImageInput(item.image ?? "");
    setCategoryInput(nextCategory);
    setModalVisible(true);
  };

  // Rellena los campos del formulario con los metadatos obtenidos del link,
  // pero solo si el usuario no ha escrito ya algo en ese campo. Esto permite
  // que la autodeteccion no pise datos ingresados manualmente.
  // Por ejemplo: si el usuario ya escribio un titulo, no se sobreescribe
  // aunque la pagina tenga un og:title diferente.
  const applyMetadataToForm = (
    normalizedUrl: string,
    metadata: LinkMetadata
  ): boolean => {
    let changed = false;

    let nextTitle = titleInput.trim();
    let nextDescription = descInput.trim();
    let nextImage = imageInput.trim();
    let nextAmount = amountInput.trim();

    if (metadata.title && !nextTitle) {
      nextTitle = metadata.title;
      setTitleInput(nextTitle);
      changed = true;
    }
    if (metadata.description && !nextDescription) {
      nextDescription = metadata.description;
      setDescInput(nextDescription);
      changed = true;
    }
    if (metadata.image && !nextImage) {
      nextImage = metadata.image;
      setImageInput(nextImage);
      changed = true;
    }
    if (metadata.price !== undefined && !nextAmount) {
      nextAmount = metadata.price.toString();
      setAmountInput(nextAmount);
      changed = true;
    }

    const inferred = inferWishCategory(`${normalizedUrl} ${metadata.title ?? ""}`);
    if (categoryInput === "objeto" && inferred !== "objeto") {
      setCategoryInput(inferred);
      changed = true;
    }

    if (!nextTitle) {
      const fallbackTitle = deriveWishTitleFromLink(normalizedUrl);
      if (fallbackTitle) {
        nextTitle = fallbackTitle;
        setTitleInput(fallbackTitle);
        changed = true;
      }
    }

    return changed;
  };

  // Normaliza el texto pegado en enlace y completa metadatos al salir del input.
  const handleLinkInputBlur = async () => {
    const rawValue = linkInput.trim();
    if (!rawValue || loading) {
      return;
    }

    let normalizedUrl = "";
    try {
      normalizedUrl = normalizeWishlistLink(rawValue);
    } catch {
      return;
    }

    if (normalizedUrl !== linkInput) {
      setLinkInput(normalizedUrl);
    }

    if (titleInput.trim() && descInput.trim() && imageInput.trim() && amountInput.trim()) {
      return;
    }

    setLoading(true);
    try {
      const metadata = await fetchLinkMetadata(normalizedUrl);
      applyMetadataToForm(normalizedUrl, metadata);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectLink = async () => {
    const rawUrl = linkInput.trim();
    if (!rawUrl) {
      showAlert("Enlace vacío", "Por favor ingresa un enlace para examinar.");
      return;
    }

    let normalizedUrl = "";
    try {
      normalizedUrl = normalizeWishlistLink(rawUrl);
      setLinkInput(normalizedUrl);
    } catch {
      showAlert("Enlace inválido", "Revisa el formato del enlace.");
      return;
    }

    setLoading(true);
    try {
      const metadata = await fetchLinkMetadata(normalizedUrl);
      const changed = applyMetadataToForm(normalizedUrl, metadata);

      if (!changed) {
        showAlert(
          "Sin datos automáticos",
          "No se encontraron metadatos completos para este enlace, pero puedes guardarlo igual."
        );
      }
    } catch {
      showAlert("Aviso", "No se pudieron precargar todos los detalles, pero puedes completarlos manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    const rawLink = linkInput.trim();
    let normalizedLink = "";

    if (rawLink) {
      try {
        normalizedLink = normalizeWishlistLink(rawLink);
        setLinkInput(normalizedLink);
      } catch {
        showAlert("Enlace inválido", "Revisa el formato del enlace antes de guardar.");
        return;
      }
    }

    let finalTitle = titleInput.trim();
    let finalDescription = descInput.trim() || undefined;
    let finalImage = imageInput.trim() || undefined;
    let finalAmountInput = amountInput.trim();
    let finalCategory: WishCategory = categoryInput;

    // Si hay link pero faltan campos, intenta llenarlos con metadatos
    // automaticos de la pagina. Esto evita que el usuario tenga que
    // escribir titulo y descripcion manualmente si pego un link valido.
    if (normalizedLink && (!finalTitle || !finalDescription || !finalImage || !finalAmountInput)) {
      setLoading(true);
      try {
        const metadata = await fetchLinkMetadata(normalizedLink);

        // Solo rellena los campos que el usuario dejo vacios.
        if (!finalTitle && metadata.title) {
          finalTitle = metadata.title;
        }
        if (!finalDescription && metadata.description) {
          finalDescription = metadata.description;
        }
        if (!finalImage && metadata.image) {
          finalImage = metadata.image;
        }
        if (!finalAmountInput && metadata.price !== undefined) {
          finalAmountInput = metadata.price.toString();
        }

        // Si la categoria sigue siendo "objeto" por defecto, intenta
        // inferirla del contexto (ej. si es un link a un concierto).
        if (finalCategory === "objeto") {
          finalCategory = inferWishCategory(`${normalizedLink} ${metadata.title ?? ""}`);
        }
      } finally {
        setLoading(false);
      }
    }

    // Si aun no hay titulo, genera uno desde el slug del enlace.
    if (!finalTitle && normalizedLink) {
      finalTitle = deriveWishTitleFromLink(normalizedLink);
    }

    if (!finalTitle) {
      showAlert("Falta información", "Escribe un título o agrega un enlace válido para generarlo automáticamente.");
      return;
    }

    // Parsea el monto permitiendo coma o punto como separador decimal.
    let price: number | undefined;
    if (finalAmountInput) {
      price = parseAmountInput(finalAmountInput);
      if (price === undefined) {
        showAlert("Precio inválido", "Ingresa un valor numérico válido para el precio.");
        return;
      }
    }

    const payload = {
      title: finalTitle,
      link: normalizedLink || "",
      amount: price,
      description: finalDescription,
      image: finalImage,
      category: finalCategory,
    };

    if (editingItemId) {
      await updateWishItem(editingItemId, payload);
    } else {
      await addWishItem(payload);
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDeleteItem = (id: string) => {
    showAlert("Eliminar deseo", "¿Deseas quitar este elemento de tu lista?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteWishItem(id);
        },
      },
    ]);
  };

  const handleOpenLink = async (url: string) => {
    if (!url) return;
    let formattedUrl = "";
    try {
      formattedUrl = normalizeWishlistLink(url);
    } catch {
      showAlert("Error", "El enlace guardado no tiene un formato válido.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(formattedUrl);
      if (supported) {
        await Linking.openURL(formattedUrl);
      } else {
        showAlert("Error", "No se puede abrir este enlace.");
      }
    } catch {
      showAlert("Error", "Ocurrió un problema al abrir el enlace.");
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundDecor colors={colors} screenVariant={4} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WishCard
            item={item}
            onPress={(w) => setViewingItem(w)}
            onDelete={handleDeleteItem}
            onOpenLink={handleOpenLink}
            onEdit={handleStartEdit}
          />
        )}
        ListHeaderComponent={
          items.length > 0 ? (
            <AppText style={styles.editHint}>
              Mantén presionada una tarjeta para editar el deseo.
            </AppText>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="Tu lista de deseos está vacía"
            subtitle="Agrega cosas que quieres obtener o hacer"
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.favButton} onPress={handleOpenCreateModal}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalView}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>{isEditing ? "Editar Deseo" : "Nuevo Deseo"}</AppText>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <AppText style={styles.label}>Enlace o texto con enlace (Opcional)</AppText>
              <View style={styles.linkRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="https://tienda.com/producto"
                  placeholderTextColor={colors.textSecondary}
                  value={linkInput}
                  onChangeText={setLinkInput}
                  onBlur={handleLinkInputBlur}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.inspectButton} onPress={handleInspectLink} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Ionicons name="search" size={20} color={colors.surface} />
                  )}
                </TouchableOpacity>
              </View>

              <AppText style={styles.label}>Título (Opcional con enlace)</AppText>
              <TextInput
                style={styles.input}
                placeholder="Ej. Consola de videojuegos"
                placeholderTextColor={colors.textSecondary}
                value={titleInput}
                onChangeText={setTitleInput}
              />

              <AppText style={styles.label}>Precio</AppText>
              <TextInput
                style={styles.input}
                placeholder="Ej. 49999"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
              />

              <AppText style={styles.label}>Descripción</AppText>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Breve nota sobre este deseo"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={descInput}
                onChangeText={setDescInput}
              />

              <AppText style={styles.label}>Categoría</AppText>
              <View style={styles.categoryList}>
                {WISH_CATEGORIES.map((cat) => {
                  const selected = categoryInput === cat;

                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryItem, selected && styles.categoryItemSelected, glowStyle]}
                      onPress={() => setCategoryInput(cat)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.categoryItemLeft}>
                        <Ionicons
                          name={WISH_CATEGORY_ICONS[cat]}
                          size={16}
                          color={selected ? colors.primary : colors.textSecondary}
                        />
                        <AppText
                          style={[styles.categoryItemText, selected && styles.categoryItemTextSelected]}
                          disableHorizontalPadding
                        >
                          {WISH_CATEGORY_LABELS[cat]}
                        </AppText>
                      </View>
                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={18}
                        color={selected ? colors.primary : colors.border}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppText style={styles.label}>Enlace de Imagen (Opcional)</AppText>
              <TextInput
                style={styles.input}
                placeholder="https://sitio.com/imagen.jpg"
                placeholderTextColor={colors.textSecondary}
                value={imageInput}
                onChangeText={setImageInput}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
                <AppText style={styles.saveButtonText}>{isEditing ? "Guardar cambios" : "Guardar deseo"}</AppText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {viewingItem && (
        <WishDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onOpenLink={handleOpenLink}
        />
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      padding: 16,
      paddingBottom: 80,
    },
    editHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    favButton: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalView: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    modalScroll: {
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    linkRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    inspectButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    categoryList: {
      gap: 8,
      marginBottom: 16,
    },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    categoryItemSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    categoryItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    categoryItemText: {
      marginLeft: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      fontWeight: "500",
      flexShrink: 1,
      paddingRight: 4,
    },
    categoryItemTextSelected: {
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 32,
    },
    saveButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
}
