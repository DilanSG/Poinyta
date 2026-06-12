import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../lib/theme";
import { useTasks } from "../hooks/useTasks";
import { useAlert } from "../components/ui/AlertModal";
import TaskItem from "../components/features/tasks/TaskItem";
import TaskDetailModal from "../components/features/tasks/TaskDetailModal";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import GlowView from "../components/ui/GlowView";
import EmptyState from "../components/ui/EmptyState";
import AppText from "../components/ui/AppText";
import { Task, TaskPriority, Note } from "../lib/storage/types";
import { awardPoints, getNotesForEntity, updateNote } from "../lib/storage";
import { getTaskCategories, addTaskCategory } from "../lib/storage/tasks";
import { scheduleTaskReminder, cancelTaskReminder } from "../lib/notifications/taskReminders";
import { syncTaskDueDateToCalendar, removeTaskFromCalendar } from "../lib/notifications/calendar";
import { addNote as storageAddNote } from "../lib/storage/notes";
import NoteModal from "../components/features/notes/NoteModal";
import NoteDetailView from "../components/features/notes/NoteDetailView";

type FilterStatus = "all" | "pending" | "completed";
type FilterPriority = "all" | TaskPriority;



const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "completed", label: "Completadas" },
];

const QUICK_DATES = [
  { label: "Hoy", getValue: () => new Date().toISOString().split("T")[0] },
  {
    label: "Mañana",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    },
  },
  {
    label: "Próx. semana",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    },
  },
];

export default function TasksScreen() {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { tasks, addTask, updateTask, toggleTask, deleteTask } = useTasks();

  const priorityOptions = useMemo(() => [
    { value: "high" as TaskPriority, label: "Alta", color: colors.error },
    { value: "medium" as TaskPriority, label: "Media", color: colors.warning },
    { value: "low" as TaskPriority, label: "Baja", color: colors.success },
  ], [colors]);
  const { showAlert } = useAlert();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("medium");
  const [formCategory, setFormCategory] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formReminder, setFormReminder] = useState("");

  const [taskCategories, setTaskCategories] = useState<string[]>([]);
  const [showCatAdd, setShowCatAdd] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (modalVisible) {
      getTaskCategories().then(setTaskCategories);
      if (editingTask) {
        getNotesForEntity("task", editingTask.id).then(setLinkedNotes);
      } else {
        setLinkedNotes([]);
      }
    }
  }, [modalVisible, editingTask]);

  useEffect(() => {
    if (viewingTask) {
      getNotesForEntity("task", viewingTask.id).then(setLinkedNotes);
    }
  }, [viewingTask]);

  const handleAddCategory = async () => {
    const term = newCatName.trim();
    if (!term) return;
    const updated = await addTaskCategory(term);
    setTaskCategories(updated);
    setFormCategory(term);
    setNewCatName("");
    setShowCatAdd(false);
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormPriority("medium");
    setFormCategory("");
    setFormDueDate("");
    setFormReminder("");
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormDueDate(task.dueDate ?? "");
    setFormReminder(task.reminder ?? "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title) return;
    const due = formDueDate.trim() || null;
    const reminder = formReminder.trim() || null;

    if (editingTask) {
      await updateTask(editingTask.id, {
        title,
        priority: formPriority,
        category: formCategory.trim(),
        dueDate: due,
        reminder,
      });
      if (reminder) {
        await scheduleTaskReminder({ ...editingTask, title, priority: formPriority, category: formCategory.trim(), dueDate: due, reminder });
      } else {
        await cancelTaskReminder(editingTask.id);
      }
      if (due) {
        await syncTaskDueDateToCalendar({ ...editingTask, title, priority: formPriority, category: formCategory.trim(), dueDate: due, reminder });
      } else {
        await removeTaskFromCalendar(editingTask.id);
      }
    } else {
      const newId = await addTask(title, formPriority, formCategory.trim(), due, reminder);
      if (newId && reminder) {
        await scheduleTaskReminder({ id: newId, title, completed: false, priority: formPriority, category: formCategory.trim(), dueDate: due, reminder, createdAt: new Date().toISOString() });
      }
      if (newId && due) {
        await syncTaskDueDateToCalendar({ id: newId, title, completed: false, priority: formPriority, category: formCategory.trim(), dueDate: due, reminder, createdAt: new Date().toISOString() });
      }
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    showAlert("Eliminar tarea", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteTask(id);
          cancelTaskReminder(id);
          removeTaskFromCalendar(id);
        },
      },
    ]);
  };

  const handleToggle = (id: string) => {
    showAlert("Completar tarea", "¿Marcar como completada? Obtendrás 10 puntos.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Completar",
        style: "default",
        onPress: async () => {
          await toggleTask(id);
          await awardPoints(10);
          cancelTaskReminder(id);
          removeTaskFromCalendar(id);
        },
      },
    ]);
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "pending") result = result.filter((t) => !t.completed);
    else if (filterStatus === "completed") result = result.filter((t) => t.completed);

    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority);

    return result;
  }, [tasks, search, filterStatus, filterPriority]);

  const handleQuickDate = (getValue: () => string) => {
    setFormDueDate(getValue());
  };

  if (viewingNote) {
    return (
      <NoteDetailView
        note={viewingNote}
        onSave={async (id, title, content, pinned) => {
          await updateNote(id, { content, title: title || null, pinned });
          setViewingNote(null);
          setViewingTask(null);
        }}
        onClose={() => setViewingNote(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundDecor colors={colors} screenVariant={2} />
      {/* Search */}
      <GlowView style={styles.searchRow} cardRadius={12}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tareas..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </GlowView>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {STATUS_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setFilterStatus(opt.value)}
            >
              <View style={[styles.filterChip, filterStatus === opt.value && styles.filterChipActive]}>
                <AppText
                  style={[styles.filterChipText, filterStatus === opt.value && styles.filterChipTextActive]}
                >
                  {opt.label}
                </AppText>
              </View>
            </Pressable>
          ))}
          <View style={styles.filterDivider} />
          <Pressable onPress={() => setFilterPriority("all")}>
            <View style={[styles.filterChip, filterPriority === "all" && styles.filterChipActive]}>
              <AppText
                style={[styles.filterChipText, filterPriority === "all" && styles.filterChipTextActive]}
              >
                Todas
              </AppText>
            </View>
          </Pressable>
                {priorityOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setFilterPriority(filterPriority === opt.value ? "all" : opt.value)}
            >
              <View style={[styles.filterChip, styles.filterChipRow, filterPriority === opt.value && styles.filterChipActive]}>
                <View style={[styles.priorityDot, { backgroundColor: opt.color }]} />
                <AppText
                  style={[styles.filterChipText, filterPriority === opt.value && styles.filterChipTextActive]}
                >
                  {opt.label}
                </AppText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onPress={(t) => {
              setViewingTask(t);
              setLinkedNotes([]);
            }}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-circle-outline"
            title={
              search || filterStatus !== "all" || filterPriority !== "all"
                ? "Sin resultados"
                : "No tienes tareas"
            }
            subtitle={
              search || filterStatus !== "all" || filterPriority !== "all"
                ? "Prueba con otros filtros"
                : "¡Disfruta tu tiempo libre!"
            }
          />
        }
        contentContainerStyle={styles.list}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle} disableHorizontalPadding>
                {editingTask ? "Editar tarea" : "Nueva tarea"}
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <AppText style={styles.fieldLabel}>Título</AppText>
              <TextInput
                style={styles.fieldInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="¿Qué hay que hacer?"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />

              <AppText style={styles.fieldLabel}>Prioridad</AppText>
              <View style={styles.priorityRow}>
          {priorityOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={{ flex: 1 }}
                    onPress={() => setFormPriority(opt.value)}
                  >
                    <View style={[
                      styles.priorityBtn,
                      formPriority === opt.value && { backgroundColor: opt.color + "20", borderColor: opt.color },
                    ]}>
                      <AppText
                        style={[
                          styles.priorityBtnText,
                          formPriority === opt.value && { color: opt.color, fontWeight: "700" },
                        ]}
                      >
                        {opt.label}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </View>

              <AppText style={styles.fieldLabel}>Categoría</AppText>
              <View style={styles.categoryGrid}>
                {taskCategories.map((cat) => (
                  <Pressable key={cat} onPress={() => setFormCategory(cat)}>
                    <View style={[styles.taskCatBadge, formCategory === cat && styles.taskCatBadgeSelected]}>
                      <AppText style={[styles.taskCatBadgeText, formCategory === cat && styles.whiteText]}>
                        {cat}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
                <Pressable onPress={() => setShowCatAdd(!showCatAdd)}>
                  <View style={styles.addTaskCatBadge}>
                    <Ionicons
                      name={showCatAdd ? "close" : "add"}
                      size={14}
                      color={colors.primary}
                    />
                    <AppText style={styles.addTaskCatText}>Nueva</AppText>
                  </View>
                </Pressable>
              </View>
              {showCatAdd && (
                <View style={styles.newCatRow}>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Nombre de categoría"
                    placeholderTextColor={colors.textSecondary}
                    value={newCatName}
                    onChangeText={setNewCatName}
                  />
                  <TouchableOpacity style={styles.newCatAddBtn} onPress={handleAddCategory}>
                    <Ionicons name="checkmark" size={22} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              )}

              <AppText style={styles.fieldLabel}>Fecha límite</AppText>
              <TextInput
                style={styles.fieldInput}
                value={formDueDate}
                onChangeText={setFormDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.quickDatesRow}>
                {QUICK_DATES.map((qd) => (
                  <Pressable
                    key={qd.label}
                    onPress={() => handleQuickDate(qd.getValue)}
                  >
                    <View style={styles.quickDateBtn}>
                      <AppText style={styles.quickDateText}>
                        {qd.label}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
                {formDueDate ? (
                  <Pressable onPress={() => setFormDueDate("")}>
                    <View style={styles.quickDateBtn}>
                      <AppText style={[styles.quickDateText, { color: colors.error }]}>
                        Quitar
                      </AppText>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              <AppText style={styles.fieldLabel}>Recordatorio</AppText>
              <TextInput
                style={styles.fieldInput}
                value={formReminder}
                onChangeText={setFormReminder}
                placeholder="YYYY-MM-DD HH:mm (opcional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.quickDatesRow}>
                {QUICK_DATES.map((qd) => (
                  <Pressable
                    key={qd.label}
                    onPress={() => {
                      const dateVal = qd.getValue();
                      setFormReminder(dateVal + " 18:00");
                    }}
                  >
                    <View style={styles.quickDateBtn}>
                      <AppText style={styles.quickDateText}>
                        {qd.label}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
                {formReminder ? (
                  <Pressable onPress={() => setFormReminder("")}>
                    <View style={styles.quickDateBtn}>
                      <AppText style={[styles.quickDateText, { color: colors.error }]}>
                        Quitar
                      </AppText>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {editingTask && (
                <>
                  <AppText style={styles.fieldLabel}>Notas vinculadas</AppText>
                  {linkedNotes.map((note) => (
                    <TouchableOpacity
                      key={note.id}
                      style={styles.linkedNoteRow}
                      onPress={() => {
                        setEditingTask({ ...editingTask }); // trigger re-render
                      }}
                    >
                      <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                      <AppText style={styles.linkedNoteText} numberOfLines={1}>
                        {note.title || note.content.split("\n")[0]}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.addLinkedNoteBtn}
                    onPress={() => setNoteModalVisible(true)}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <AppText style={styles.addLinkedNoteText}>Agregar nota</AppText>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, !formTitle.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!formTitle.trim()}
              >
                <AppText style={styles.saveBtnText} disableHorizontalPadding>
                  {editingTask ? "Guardar" : "Crear tarea"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NoteModal
        visible={noteModalVisible}
        note={null}
        prefillLinks={editingTask ? [{ entityType: "task", entityId: editingTask.id }] : []}
        onSave={async (data) => {
          await storageAddNote(data.content, data.title || null, data.pinned, [
            ...data.links,
            ...(editingTask ? [{ entityType: "task" as const, entityId: editingTask.id }] : []),
          ]);
          if (editingTask) {
            const updated = await getNotesForEntity("task", editingTask.id);
            setLinkedNotes(updated);
          }
          setNoteModalVisible(false);
        }}
        onClose={() => setNoteModalVisible(false)}
      />

      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          linkedNotes={linkedNotes}
          onClose={() => setViewingTask(null)}
          onNotePress={(note) => setViewingNote(note)}
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
      padding: 16,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
    },
    filtersRow: {
      marginBottom: 14,
    },
    filtersScroll: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexGrow: 0,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: "flex-start",
    },
    filterChipRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    filterChipActive: {
      backgroundColor: colors.primary + "20",
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    filterDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    list: {
      paddingBottom: 80,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    modalBody: {
      flexGrow: 0,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    fieldInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      color: colors.textPrimary,
      fontSize: 15,
    },
    priorityRow: {
      flexDirection: "row",
      gap: 8,
    },
    priorityBtn: {
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    priorityBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    quickDatesRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 6,
      flexGrow: 0,
    },
    quickDateBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: "flex-start",
    },
    quickDateText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 4,
    },
    taskCatBadge: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    taskCatBadgeSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    taskCatBadgeText: {
      fontSize: 12,
      color: colors.textPrimary,
    },
    addTaskCatBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderColor: colors.primary,
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 4,
    },
    addTaskCatText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },
    newCatRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 4,
    },
    newCatAddBtn: {
      backgroundColor: colors.success,
      borderRadius: 10,
      width: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    whiteText: {
      color: colors.surface,
    },
    modalFooter: {
      marginTop: 16,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
    },
    linkedNoteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary + "0C",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 4,
    },
    linkedNoteText: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
    },
    addLinkedNoteBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
    },
    addLinkedNoteText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
  });
}
