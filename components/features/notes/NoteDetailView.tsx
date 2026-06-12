import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Note, Task, Goal, GoalStep } from "../../../lib/storage/types";
import { useTheme, ThemeColors } from "../../../lib/theme";
import { getTasks, getGoals } from "../../../lib/storage";
import AppText from "../../ui/AppText";

const BOTTOM_SAFE = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 16;

type EntityNav = {
  type: string;
  label: string;
  entityType: "task" | "goal" | "goal_step";
  entityId: string;
};

type Props = {
  note: Note;
  onSave: (id: string, title: string | null, content: string, pinned: boolean) => void;
  onClose: () => void;
};

export default function NoteDetailView({ note, onSave, onClose }: Props) {
  const colors = useTheme();
  const router = useRouter();
  const styles = getStyles(colors);

  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [pinned, setPinned] = useState(note.pinned);
  const [entities, setEntities] = useState<EntityNav[]>([]);

  const originalRef = useRef({ title: note.title ?? "", content: note.content, pinned: note.pinned });
  const savedRef = useRef(false);

  useEffect(() => {
    if (note.links.length === 0) return;
    let cancelled = false;
    (async () => {
      const [tasks, goals] = await Promise.all([getTasks(), getGoals()]);
      if (cancelled) return;
      const result: EntityNav[] = [];
      for (const link of note.links) {
        if (link.entityType === "task") {
          const task = tasks.find((t: Task) => t.id === link.entityId);
          if (task) result.push({ type: "Tarea", label: task.title, entityType: "task", entityId: link.entityId });
        } else if (link.entityType === "goal") {
          const goal = goals.find((g: Goal) => g.id === link.entityId);
          if (goal) result.push({ type: "Meta", label: goal.title, entityType: "goal", entityId: link.entityId });
        } else if (link.entityType === "goal_step") {
          for (const goal of goals) {
            const step = goal.steps.find((s: GoalStep) => s.id === link.entityId);
            if (step) result.push({ type: "Paso", label: step.title, entityType: "goal_step", entityId: link.entityId });
          }
        }
      }
      setEntities(result);
    })();
    return () => { cancelled = true; };
  }, [note.links]);

  const handleBack = useCallback(() => {
    const orig = originalRef.current;
    const hasChanges =
      title !== orig.title ||
      content !== orig.content ||
      pinned !== orig.pinned;

    if (hasChanges && !savedRef.current) {
      savedRef.current = true;
      onSave(note.id, title || null, content, pinned);
    }
    onClose();
  }, [title, content, pinned, note.id, onSave, onClose]);

  const handleLinkPress = (entity: EntityNav) => {
    if (entity.entityType === "task") {
      router.push("/tasks");
    } else if (entity.entityType === "goal" || entity.entityType === "goal_step") {
      router.push("/goals");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} numberOfLines={1}>
          {title || "Sin título"}
        </AppText>
        <TouchableOpacity onPress={() => setPinned(!pinned)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={pinned ? "pin" : "pin-outline"}
            size={22}
            color={pinned ? colors.primary : colors.textSecondary}
            style={{ transform: [{ rotate: "45deg" }] }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.contentInput}
          placeholder="Escribe algo..."
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={(t) => { setContent(t); }}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: BOTTOM_SAFE }]}>
        <View style={styles.metaSection}>
          <AppText style={styles.dateLabel}>
            Creada el {new Date(note.createdAt).toLocaleDateString("es", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </AppText>
        </View>

        {entities.length > 0 && (
          <View style={styles.linksSection}>
            {entities.map((entity, i) => (
              <TouchableOpacity
                key={i}
                style={styles.linkChip}
                onPress={() => handleLinkPress(entity)}
              >
                <Ionicons name="link-outline" size={14} color={colors.primary} />
                <AppText style={styles.linkChipType}>{entity.type}:</AppText>
                <AppText style={styles.linkChipLabel} numberOfLines={1}>{entity.label}</AppText>
                <Ionicons name="open-outline" size={12} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center",
      marginHorizontal: 8,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: 16,
      paddingBottom: 16,
    },
    contentInput: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
      minHeight: 200,
      textAlignVertical: "top",
      paddingVertical: 4,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.background,
    },
    metaSection: {
      marginBottom: 8,
    },
    dateLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    linksSection: {
      gap: 4,
    },
    linkChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary + "0C",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    linkChipType: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    linkChipLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.primary,
    },
  });
