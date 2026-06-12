import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Note, NoteEntityType, Task, Goal, GoalStep } from "../../../lib/storage/types";
import { useTheme, ThemeColors } from "../../../lib/theme";
import { getTasks, getGoals } from "../../../lib/storage";
import AppText from "../../ui/AppText";

type LinkEntry = { entityType: NoteEntityType; entityId: string };

type Props = {
  visible: boolean;
  note: Note | null;
  prefillLinks?: LinkEntry[];
  onSave: (data: {
    title: string;
    content: string;
    pinned: boolean;
    links: LinkEntry[];
  }) => void;
  onClose: () => void;
};

type PickStep = "idle" | "type" | "task" | "goal" | "goal_step_pick_goal" | "goal_step_pick_step";

const TYPE_OPTIONS: { value: NoteEntityType; label: string; icon: string }[] = [
  { value: "task", label: "Tarea", icon: "checkbox-outline" },
  { value: "goal", label: "Meta", icon: "ribbon-outline" },
  { value: "goal_step", label: "Paso de meta", icon: "git-branch-outline" },
];

export default function NoteModal({ visible, note, prefillLinks, onSave, onClose }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const isEditing = note !== null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [links, setLinks] = useState<LinkEntry[]>([]);

  const [pickStep, setPickStep] = useState<PickStep>("idle");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pickGoalId, setPickGoalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      if (note) {
        setTitle(note.title ?? "");
        setContent(note.content);
        setPinned(note.pinned);
        setLinks(note.links.map((l) => ({ entityType: l.entityType, entityId: l.entityId })));
      } else {
        setTitle("");
        setContent("");
        setPinned(false);
        setLinks(prefillLinks || []);
      }
      setPickStep("idle");
      setSearchQuery("");
      setPickGoalId(null);
      getTasks().then(setTasks);
      getGoals().then(setGoals);
    }
  }, [visible, note]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), pinned, links });
  };

  const removeLink = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLink = (entityType: NoteEntityType, entityId: string) => {
    const exists = links.some((l) => l.entityType === entityType && l.entityId === entityId);
    if (!exists) {
      setLinks((prev) => [...prev, { entityType, entityId }]);
    }
    setPickStep("idle");
    setSearchQuery("");
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    const q = searchQuery.toLowerCase();
    return goals.filter((g) => g.title.toLowerCase().includes(q));
  }, [goals, searchQuery]);

  const pickedGoal = goals.find((g) => g.id === pickGoalId);
  const filteredSteps = useMemo(() => {
    if (!pickedGoal) return [];
    if (!searchQuery.trim()) return pickedGoal.steps;
    const q = searchQuery.toLowerCase();
    return pickedGoal.steps.filter((s: GoalStep) => s.title.toLowerCase().includes(q));
  }, [pickedGoal, searchQuery]);

  const pickerTitle =
    pickStep === "type"
      ? "Tipo de vínculo"
      : pickStep === "task"
      ? "Seleccionar tarea"
      : pickStep === "goal"
      ? "Seleccionar meta"
      : pickStep === "goal_step_pick_goal"
      ? "Seleccionar meta"
      : pickStep === "goal_step_pick_step"
      ? "Seleccionar paso"
      : "";

  const getEntityName = (link: LinkEntry): string => {
    if (link.entityType === "task") {
      const t = tasks.find((t) => t.id === link.entityId);
      return t ? t.title : "Tarea";
    }
    if (link.entityType === "goal") {
      const g = goals.find((g) => g.id === link.entityId);
      return g ? g.title : "Meta";
    }
    if (link.entityType === "goal_step") {
      for (const g of goals) {
        const s = g.steps.find((s: GoalStep) => s.id === link.entityId);
        if (s) return s.title;
      }
      return "Paso";
    }
    return "";
  };

  const getEntityTypeLabel = (type: NoteEntityType): string => {
    const opt = TYPE_OPTIONS.find((o) => o.value === type);
    return opt ? opt.label : type;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modal}>
          {pickStep === "idle" ? (
            <>
              <View style={styles.header}>
                <AppText style={styles.headerTitle}>
                  {isEditing ? "Editar nota" : "Nueva nota"}
                </AppText>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formScroll}>
                <AppText style={styles.label}>Título (opcional)</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="Título de la nota"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />

                <AppText style={styles.label}>Contenido</AppText>
                <TextInput
                  style={[styles.input, styles.contentInput]}
                  placeholder="Escribe algo..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                />

                <AppText style={styles.label}>Vinculado a</AppText>
                {links.length > 0 && (
                  <View style={styles.linksList}>
                    {links.map((link, idx) => (
                      <View key={idx} style={styles.linkChip}>
                        <Ionicons
                          name={TYPE_OPTIONS.find((o) => o.value === link.entityType)?.icon as any || "link-outline"}
                          size={14}
                          color={colors.primary}
                        />
                        <AppText style={styles.linkChipText} numberOfLines={1}>
                          {getEntityTypeLabel(link.entityType)}: {getEntityName(link)}
                        </AppText>
                        <TouchableOpacity onPress={() => removeLink(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.addLinkBtn} onPress={() => setPickStep("type")}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <AppText style={styles.addLinkText}>Agregar vínculo</AppText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.pinRow} onPress={() => setPinned(!pinned)}>
                  <Ionicons
                    name={pinned ? "pin" : "pin-outline"}
                    size={18}
                    color={pinned ? colors.primary : colors.textSecondary}
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                  <AppText style={[styles.pinLabel, pinned && { color: colors.primary }]}>
                    {pinned ? "Fijada al inicio" : "Fijar al inicio"}
                  </AppText>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <AppText style={styles.cancelText}>Cancelar</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !content.trim() && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={!content.trim()}
                >
                  <AppText style={styles.saveText}>Guardar</AppText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => { setPickStep("idle"); setSearchQuery(""); setPickGoalId(null); }}>
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>{pickerTitle}</AppText>
                <View style={{ width: 22 }} />
              </View>

              <TextInput
                style={[styles.input, { marginHorizontal: 16, marginBottom: 8 }]}
                placeholder="Buscar..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {pickStep === "type" && (
                <View style={styles.typeList}>
                  {TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={styles.typeOption}
                      onPress={() => {
                        if (opt.value === "goal_step") setPickStep("goal_step_pick_goal");
                        else setPickStep(opt.value as PickStep);
                        setSearchQuery("");
                      }}
                    >
                      <Ionicons name={opt.icon as any} size={22} color={colors.primary} />
                      <AppText style={styles.typeOptionLabel}>{opt.label}</AppText>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {pickStep === "task" && (
                <FlatList
                  data={filteredTasks}
                  keyExtractor={(item) => item.id}
                  style={styles.pickerList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => addLink("task", item.id)}
                    >
                      <Ionicons name="checkbox-outline" size={18} color={colors.primary} />
                      <AppText style={styles.pickerItemText} numberOfLines={1}>
                        {item.title}
                      </AppText>
                    </TouchableOpacity>
                  )}
                />
              )}

              {pickStep === "goal" && (
                <FlatList
                  data={filteredGoals}
                  keyExtractor={(item) => item.id}
                  style={styles.pickerList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => addLink("goal", item.id)}
                    >
                      <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                      <AppText style={styles.pickerItemText} numberOfLines={1}>
                        {item.title}
                      </AppText>
                    </TouchableOpacity>
                  )}
                />
              )}

              {pickStep === "goal_step_pick_goal" && (
                <FlatList
                  data={filteredGoals}
                  keyExtractor={(item) => item.id}
                  style={styles.pickerList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => { setPickGoalId(item.id); setPickStep("goal_step_pick_step"); setSearchQuery(""); }}
                    >
                      <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                      <AppText style={styles.pickerItemText} numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                />
              )}

              {pickStep === "goal_step_pick_step" && (
                <FlatList
                  data={filteredSteps}
                  keyExtractor={(item) => item.id}
                  style={styles.pickerList}
                  ListEmptyComponent={
                    <AppText style={{ textAlign: "center", padding: 20, color: colors.textSecondary }}>
                      {pickedGoal ? "No hay pasos en esta meta" : "Selecciona una meta primero"}
                    </AppText>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => addLink("goal_step", item.id)}
                    >
                      <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
                      <AppText style={styles.pickerItemText} numberOfLines={1}>
                        {item.title}
                      </AppText>
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      minHeight: "60%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    formScroll: {
      padding: 16,
      paddingBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      color: colors.textPrimary,
      fontSize: 15,
    },
    contentInput: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    linksList: {
      gap: 6,
      marginBottom: 6,
    },
    linkChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary + "10",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    linkChipText: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
    },
    addLinkBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
    },
    addLinkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
    },
    pinRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 8,
    },
    pinLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footer: {
      flexDirection: "row",
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    saveText: {
      fontSize: 14,
      color: "#FAF8F5",
      fontWeight: "600",
    },
    typeList: {
      paddingHorizontal: 16,
      gap: 4,
    },
    typeOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    typeOptionLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
    },
    pickerList: {
      paddingHorizontal: 16,
      maxHeight: 400,
    },
    pickerItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "50",
    },
    pickerItemText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
  });
