import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task, Note } from "../../../lib/storage/types";
import { useTheme, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";

const PRIORITY_CONFIG = {
  high: { label: "Alta", color: "#EF4444" },
  medium: { label: "Media", color: "#F59E0B" },
  low: { label: "Baja", color: "#10B981" },
};

type Props = {
  task: Task;
  linkedNotes: Note[];
  onClose: () => void;
  onNotePress: (note: Note) => void;
};

export default function TaskDetailModal({ task, linkedNotes, onClose, onNotePress }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const pConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <AppText style={styles.headerTitle} numberOfLines={2} disableHorizontalPadding>
              {task.title}
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* Estado */}
            <View style={styles.row}>
              <Ionicons
                name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={task.completed ? colors.success : colors.textSecondary}
              />
              <AppText style={styles.rowText} disableHorizontalPadding>
                {task.completed ? "Completada" : "Pendiente"}
              </AppText>
            </View>

            {/* Prioridad */}
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: pConfig.color }]} />
              <AppText style={styles.rowText} disableHorizontalPadding>
                Prioridad {pConfig.label.toLowerCase()}
              </AppText>
            </View>

            {/* Categoría */}
            {task.category ? (
              <View style={styles.row}>
                <Ionicons name="folder-outline" size={18} color={colors.textSecondary} />
                <AppText style={styles.rowText} disableHorizontalPadding>
                  {task.category}
                </AppText>
              </View>
            ) : null}

            {/* Fecha límite */}
            {task.dueDate ? (
              <View style={styles.row}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={isOverdue ? "#EF4444" : colors.textSecondary}
                />
                <AppText
                  style={[styles.rowText, isOverdue && { color: "#EF4444", fontWeight: "700" }]}
                  disableHorizontalPadding
                >
                  {new Date(task.dueDate).toLocaleDateString("es-ES", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                  {isOverdue ? " (vencida)" : ""}
                </AppText>
              </View>
            ) : null}

            {/* Recordatorio */}
            {task.reminder ? (
              <View style={styles.row}>
                <Ionicons name="alarm-outline" size={18} color={colors.textSecondary} />
                <AppText style={styles.rowText} disableHorizontalPadding>
                  {new Date(task.reminder).toLocaleDateString("es-ES", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </AppText>
              </View>
            ) : null}

            {/* Creada */}
            <View style={styles.row}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <AppText style={styles.rowText} disableHorizontalPadding>
                Creada el {new Date(task.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </AppText>
            </View>

            {/* Notas vinculadas */}
            {linkedNotes.length > 0 && (
              <View style={styles.notesSection}>
                <AppText style={styles.notesSectionTitle} disableHorizontalPadding>
                  Notas vinculadas
                </AppText>
                {linkedNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.noteRow}
                    onPress={() => onNotePress(note)}
                  >
                    <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                    <AppText style={styles.noteTitle} numberOfLines={1}>
                      {note.title || note.content.split("\n")[0]}
                    </AppText>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    notesSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    notesSectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary + "0C",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
    },
    noteTitle: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
  });
