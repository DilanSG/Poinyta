import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Note, Task, Goal, GoalStep } from "../../../lib/storage/types";
import { useTheme, useGlow, ThemeColors } from "../../../lib/theme";
import { getTasks, getGoals } from "../../../lib/storage";
import AppText from "../../ui/AppText";

type Props = {
  item: Note;
  onPress: (note: Note) => void;
  onLongPress: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
};

type EntityLabel = {
  type: string;
  label: string;
  icon: string;
};

function useEntityLabels(links: Note["links"]): EntityLabel[] {
  const [labels, setLabels] = useState<EntityLabel[]>([]);

  useEffect(() => {
    if (links.length === 0) {
      setLabels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [tasks, goals] = await Promise.all([getTasks(), getGoals()]);
      if (cancelled) return;
      const result: EntityLabel[] = [];
      for (const link of links) {
        if (link.entityType === "task") {
          const task = tasks.find((t: Task) => t.id === link.entityId);
          if (task) result.push({ type: "task", label: task.title, icon: "checkbox-outline" });
        } else if (link.entityType === "goal") {
          const goal = goals.find((g: Goal) => g.id === link.entityId);
          if (goal) result.push({ type: "goal", label: goal.title, icon: "ribbon-outline" });
        } else if (link.entityType === "goal_step") {
          for (const goal of goals) {
            const step = goal.steps.find((s: GoalStep) => s.id === link.entityId);
            if (step) result.push({ type: "goal_step", label: step.title, icon: "git-branch-outline" });
          }
        }
      }
      setLabels(result);
    })();
    return () => { cancelled = true; };
  }, [links]);

  return labels;
}

export function NoteCard({ item, onPress, onLongPress, onDelete, onPin }: Props) {
  const colors = useTheme();
  const { glowStyle } = useGlow();
  const styles = getStyles(colors);
  const entityLabels = useEntityLabels(item.links);

  const displayTitle =
    item.title || item.content.split("\n")[0].slice(0, 60);

  return (
    <TouchableOpacity
      style={[styles.noteCard, glowStyle]}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.noteContent}>
          <View style={styles.titleRow}>
            {item.pinned && (
              <Ionicons name="pin" size={14} color={colors.primary} style={{ transform: [{ rotate: "45deg" }], marginRight: 4 }} />
            )}
            <AppText style={styles.noteTitle} numberOfLines={1}>
              {displayTitle}
            </AppText>
          </View>
          {item.title && item.content ? (
            <AppText style={styles.notePreview} numberOfLines={2}>
              {item.content}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            <AppText style={styles.noteDate}>
              {new Date(item.createdAt).toLocaleDateString("es")}
            </AppText>
            {entityLabels.length > 0 && (
              <View style={styles.chipsRow}>
                {entityLabels.slice(0, 2).map((el, i) => (
                  <View key={i} style={styles.chip}>
                    <Ionicons
                      name={el.icon as any}
                      size={10}
                      color={colors.primary}
                    />
                    <AppText style={styles.chipText} numberOfLines={1}>
                      {el.label}
                    </AppText>
                  </View>
                ))}
                {entityLabels.length > 2 && (
                  <AppText style={styles.chipMore}>+{entityLabels.length - 2}</AppText>
                )}
              </View>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onPin(item.id, item.pinned)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={item.pinned ? "pin" : "pin-outline"}
              size={18}
              color={item.pinned ? colors.primary : colors.textSecondary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    noteCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    noteContent: {
      flex: 1,
      marginRight: 10,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    noteTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      flex: 1,
    },
    notePreview: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 6,
      gap: 6,
    },
    noteDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    chipsRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 4,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.primary + "12",
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    chipText: {
      fontSize: 10,
      color: colors.primary,
      maxWidth: 80,
    },
    chipMore: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingTop: 2,
    },
  });

export default NoteCard;
