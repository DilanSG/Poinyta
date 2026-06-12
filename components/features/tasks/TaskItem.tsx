import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "../../../lib/storage/types";
import { useTheme, useGlow, ThemeColors } from "../../../lib/theme";
import AppText from "../../ui/AppText";

type Props = {
  item: Task;
  onPress: (item: Task) => void;
  onToggle: (id: string) => void;
  onEdit: (item: Task) => void;
  onDelete: (id: string) => void;
};

const PRIORITY_CONFIG = {
  high: { label: "Alta", color: "#EF4444" },
  medium: { label: "Media", color: "#F59E0B" },
  low: { label: "Baja", color: "#10B981" },
};

export function TaskItem({ item, onPress, onToggle, onEdit, onDelete }: Props) {
  const colors = useTheme();
  const { glowStyle } = useGlow();
  const styles = getStyles(colors);
  const pConfig = PRIORITY_CONFIG[item.priority];
  const isOverdue =
    item.dueDate && !item.completed && new Date(item.dueDate) < new Date();

  return (
    <TouchableOpacity
      style={[styles.taskRow, item.completed && styles.taskRowCompleted, glowStyle]}
        onPress={() => onPress(item)}
        onLongPress={() => onEdit(item)}
        activeOpacity={0.7}
        delayLongPress={400}
      >
        {item.completed ? (
          <Ionicons name="checkbox" size={22} color={colors.success} />
        ) : (
          <TouchableOpacity onPress={() => onToggle(item.id)} hitSlop={8}>
            <Ionicons name="square-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.taskContent}>
          <AppText
            style={[styles.taskText, item.completed && styles.taskTextCompleted]}
            disableHorizontalPadding
            numberOfLines={2}
          >
            {item.title}
          </AppText>

          <View style={styles.taskMeta}>
            {item.category ? (
              <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
                <AppText style={[styles.badgeText, { color: colors.primary }]}>
                  {item.category}
                </AppText>
              </View>
            ) : null}

            <View style={[styles.badge, { backgroundColor: pConfig.color + "20" }]}>
              <AppText style={[styles.badgeText, { color: pConfig.color }]}>
                {pConfig.label}
              </AppText>
            </View>

            {item.dueDate ? (
              <AppText
                style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}
                disableHorizontalPadding
              >
                {new Date(item.dueDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </AppText>
            ) : null}
          </View>
        </View>

        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
        </TouchableOpacity>
    );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      gap: 10,
    },
    taskRowCompleted: {
      opacity: 0.65,
    },
    taskContent: {
      flex: 1,
      minWidth: 0,
    },
    taskText: {
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    taskTextCompleted: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    taskMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      alignItems: "center",
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "600",
    },
    dueDate: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    dueDateOverdue: {
      color: "#EF4444",
      fontWeight: "700",
    },
  });

export default TaskItem;
