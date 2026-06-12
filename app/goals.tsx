import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useGoals } from "../hooks/useGoals";
import { useNotifications } from "../components/layout/NotificationContext";
import { useAlert } from "../components/ui/AlertModal";
import { useTheme, useThemeMode, ThemeColors, useGlow } from "../lib/theme";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import { Ionicons } from "@expo/vector-icons";
import { Goal, GoalStep, Note } from "../lib/storage/types";
import { addTask } from "../lib/storage/tasks";
import { getNotesForEntity } from "../lib/storage";
import { addNote as storageAddNote } from "../lib/storage/notes";
import NoteModal from "../components/features/notes/NoteModal";
import GlowView from "../components/ui/GlowView";

// Pantalla de Metas: tarjetas mínimas con mapa mental tipo canvas al tocar cada tarjeta.
export default function GoalsScreen() {
  const colors = useTheme();
  const styles = getStyles(colors);

  const {
    goals,
    userPoints,
    createGoal,
    addStepToGoal,
    removeStep,
    toggleStep,
    finalizeGoal,
    deleteGoalId,
    reorderGoals,
    updateGoal,
    error,
    setError,
  } = useGoals();
  const { triggerNotification } = useNotifications();
  const { showAlert } = useAlert();

  const [createVisible, setCreateVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [ptsModalVisible, setPtsModalVisible] = useState(false);

  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const [confirmGoal, setConfirmGoal] = useState<Goal | null>(null);
  const [actionMode, setActionMode] = useState<"edit" | "delete" | "move" | null>(null);
  const [movePick, setMovePick] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleEditSave = async () => {
    const title = editTitle.trim();
    if (!title || !editGoal) return;
    await updateGoal(editGoal.id, { title, description: editDesc.trim() || undefined });
    setEditGoal(null);
    triggerNotification("Meta actualizada", "success");
  };

  const handleSaveGoal = async () => {
    const title = goalTitle.trim();
    if (!title) {
      showAlert("Atención", "La meta necesita un título.");
      return;
    }
    try {
      await createGoal(title, goalDesc.trim() || undefined);
      triggerNotification("Meta creada", "success");
      setGoalTitle("");
      setGoalDesc("");
      setCreateVisible(false);
    } catch {
      showAlert("Error", "No se pudo guardar la meta.");
    }
  };

  const handleConfirmComplete = async (goal: Goal) => {
    try {
      const transitioned = await finalizeGoal(goal.id);
      if (transitioned) {
        triggerNotification(
          `"${goal.title}" completada · +50 puntos`,
          "success"
        );
      }
      setConfirmGoal(null);
      setDetailGoal(null);
    } catch (err: unknown) {
      triggerNotification(err instanceof Error ? err.message : "No se pudo completar", "warning");
      setConfirmGoal(null);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    showAlert("Eliminar meta", `¿Eliminar "${goal.title}" y todos sus pasos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteGoalId(goal.id);
          triggerNotification("Meta eliminada", "info");
          if (detailGoal?.id === goal.id) setDetailGoal(null);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BackgroundDecor colors={colors} screenVariant={0} />

      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.screenTitle}>Metas</AppText>
        <TouchableOpacity onPress={() => setPtsModalVisible(true)} activeOpacity={0.7}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={13} color={colors.warning} />
            <AppText style={styles.pointsText}>{userPoints} pts</AppText>
          </View>
        </TouchableOpacity>
      </View>

      {error ? (
        <GlowView style={styles.errorBanner} cardRadius={12}>
          <AppText style={styles.errorText}>{error}</AppText>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </GlowView>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {goals.length === 0 ? (
          <EmptyState
            icon="ribbon-outline"
            title="Aún no tienes metas"
            subtitle="Toca el botón + para crear la primera"
          />
        ) : (
          <>
            {actionMode !== null && (
              <AppText style={styles.actionHint}>
                {actionMode === "move" && !movePick
                  ? "Toca la primera meta para mover"
                  : actionMode === "move" && movePick
                  ? "Toca la segunda meta para intercambiar"
                  : actionMode === "edit"
                  ? "Toca la meta que quieras editar"
                  : "Toca la meta que quieras eliminar"}
              </AppText>
            )}
            <View style={styles.goalsList}>
              {goals.map((goal, index) => (
                <View
                  key={goal.id}
                  style={[
                    styles.cardWrap,
                    movePick === goal.id && styles.cardWrapPicked,
                  ]}
                >
                  <GoalCard
                    goal={goal} index={index}
                    onPress={async () => {
                      if (actionMode === "edit") {
                        setEditTitle(goal.title);
                        setEditDesc(goal.description || "");
                        setEditGoal(goal);
                        setActionMode(null);
                      } else if (actionMode === "delete") {
                        setActionMode(null);
                        setMovePick(null);
                        handleDeleteGoal(goal);
                      } else if (actionMode === "move") {
                        if (!movePick) setMovePick(goal.id);
                        else if (movePick === goal.id) setMovePick(null);
                        else {
                          await swapAndReorder(goals, movePick, goal.id, reorderGoals, setMovePick);
                        }
                      } else if (goal.status === "completed") {
                        setCompletedGoal(goal);
                      } else {
                        setDetailGoal(goal);
                      }
                    }}
                    onLongPress={() => {
                      if (actionMode === null) setActionMode("edit");
                    }}
                    colors={colors} styles={styles}
                  />
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating action toolbar */}
      {actionMode !== null && (
        <View style={styles.floatingToolbar}>
          <TouchableOpacity
            style={[styles.floatingToolBtn, { backgroundColor: colors.primary }, actionMode === "edit" && styles.floatingToolActive]}
            onPress={() => { setActionMode("edit"); setMovePick(null); }}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingToolBtn, { backgroundColor: colors.error }, actionMode === "delete" && styles.floatingToolActive]}
            onPress={() => { setActionMode("delete"); setMovePick(null); }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingToolBtn, { backgroundColor: colors.warning }, actionMode === "move" && styles.floatingToolActive]}
            onPress={() => {
              if (actionMode === "move") { setActionMode(null); setMovePick(null); }
              else setActionMode("move");
            }}
          >
            <Ionicons name={actionMode === "move" ? "checkmark-outline" : "swap-vertical-outline"} size={20} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingToolBtn, { backgroundColor: colors.textSecondary }]}
            onPress={() => { setActionMode(null); setMovePick(null); }}
          >
            <Ionicons name="close" size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      )}

      {/* FAB: idéntico al de finance y wishlist */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setGoalTitle("");
          setGoalDesc("");
          setCreateVisible(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      {/* Modal: crear meta */}
      <Modal
        visible={createVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalView}
          >
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Nueva meta</AppText>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <AppText style={styles.label}>Título</AppText>
              <TextInput
                style={styles.input}
                placeholder="Ej. Aprender italiano"
                placeholderTextColor={colors.textSecondary}
                value={goalTitle}
                onChangeText={setGoalTitle}
                returnKeyType="next"
              />
              <AppText style={styles.label}>Descripción (opcional)</AppText>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                placeholder="¿Por qué te importa esta meta?"
                placeholderTextColor={colors.textSecondary}
                value={goalDesc}
                onChangeText={setGoalDesc}
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoal}>
                <AppText style={styles.saveBtnText}>Crear meta</AppText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: editar meta */}
      <Modal
        visible={!!editGoal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditGoal(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalView}
          >
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Editar meta</AppText>
              <TouchableOpacity onPress={() => setEditGoal(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <AppText style={styles.label}>Título</AppText>
              <TextInput
                style={styles.input}
                placeholder="Título de la meta"
                placeholderTextColor={colors.textSecondary}
                value={editTitle}
                onChangeText={setEditTitle}
                returnKeyType="next"
              />
              <AppText style={styles.label}>Descripción</AppText>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                placeholder="Descripción opcional"
                placeholderTextColor={colors.textSecondary}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditSave}>
                <AppText style={styles.saveBtnText}>Guardar cambios</AppText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: detalle / mapa mental */}
      {detailGoal ? (
        <GoalDetailModal
          goal={detailGoal}
          goals={goals}
          addStepToGoal={addStepToGoal}
          removeStep={removeStep}
          toggleStep={toggleStep}
          onClose={() => setDetailGoal(null)}
          onRequestComplete={(g) => setConfirmGoal(g)}
        />
      ) : null}

      {/* Modal: dashboard de meta completada */}
      {completedGoal ? (
        <CompletedGoalDashboard
          goal={completedGoal}
          onClose={() => setCompletedGoal(null)}
        />
      ) : null}

      {/* Modal: felicitación al completar */}
      {confirmGoal ? (
        <CompletionModal
          goal={confirmGoal}
          onConfirm={() => handleConfirmComplete(confirmGoal)}
          onCancel={() => setConfirmGoal(null)}
        />
      ) : null}

      {/* Modal: explicación de puntos */}
      <Modal visible={ptsModalVisible} transparent animationType="fade" onRequestClose={() => setPtsModalVisible(false)}>
        <View style={styles.ptsOverlay}>
          <GlowView style={styles.ptsCard} cardRadius={12}>
            <View style={styles.ptsHeader}>
              <AppText style={styles.ptsTitle}>¿Qué son los puntos?</AppText>
              <TouchableOpacity onPress={() => setPtsModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <AppText style={styles.ptsDesc}>
              Los puntos son una recompensa por completar metas. Puedes usarlos en la tienda de temas
              para personalizar la apariencia de la app.
            </AppText>

            <View style={styles.ptsDivider} />

            <AppText style={styles.ptsSubtitle}>Cómo ganar puntos</AppText>

            <View style={styles.ptsRow}>
              <View style={[styles.ptsIconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name="checkbox-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.ptsRowText}>
                <AppText style={styles.ptsRowTitle}>Completar un paso</AppText>
                <AppText style={styles.ptsRowDesc}>+5 puntos por cada paso completado</AppText>
              </View>
            </View>

            <View style={styles.ptsRow}>
              <View style={[styles.ptsIconWrap, { backgroundColor: colors.success + "18" }]}>
                <Ionicons name="trophy-outline" size={18} color={colors.success} />
              </View>
              <View style={styles.ptsRowText}>
                <AppText style={styles.ptsRowTitle}>Completar una meta</AppText>
                <AppText style={styles.ptsRowDesc}>+50 puntos al finalizar la meta completa</AppText>
              </View>
            </View>

            <View style={styles.ptsDivider} />

            <AppText style={styles.ptsSubtitle}>Cómo gastar puntos</AppText>

            <View style={styles.ptsRow}>
              <View style={[styles.ptsIconWrap, { backgroundColor: colors.warning + "18" }]}>
                <Ionicons name="color-palette-outline" size={18} color={colors.warning} />
              </View>
              <View style={styles.ptsRowText}>
                <AppText style={styles.ptsRowTitle}>Tienda de temas</AppText>
                <AppText style={styles.ptsRowDesc}>Canjea 100 puntos por un tema nuevo en Ajustes → Personalización</AppText>
              </View>
            </View>

            <TouchableOpacity style={styles.ptsBtn} onPress={() => setPtsModalVisible(false)}>
              <AppText style={styles.ptsBtnText}>Entendido</AppText>
            </TouchableOpacity>
          </GlowView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

async function swapAndReorder(
  goals: Goal[], pickId: string, targetId: string,
  reorderFn: (ids: string[]) => Promise<void>,
  setPick: (id: string | null) => void,
) {
  const ids = goals.map(g => g.id);
  const fromIdx = ids.indexOf(pickId);
  const toIdx = ids.indexOf(targetId);
  const newIds = [...ids];
  newIds[fromIdx] = targetId;
  newIds[toIdx] = pickId;
  await reorderFn(newIds);
  setPick(null);
}


// ─── Card de meta ───────────────────────────────────────────────────────────

type GoalCardProps = {
  goal: Goal;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
};

function GoalCard({
  goal, index,
  onPress, onLongPress, colors, styles,
}: GoalCardProps) {
  const isCompleted = goal.status === "completed";
  const statusLabel = isCompleted ? "Completada" : "En proceso";
  const statusColor = isCompleted ? colors.success : colors.primary;
  const statusIcon: keyof typeof Ionicons.glyphMap = isCompleted
    ? "checkmark-circle"
    : "time-outline";
  const orderColors = [colors.warning, colors.textSecondary, colors.error];
  const orderColor = index < 3 ? orderColors[index] : undefined;
  const { glowStyle } = useGlow();

  return (
    <TouchableOpacity
      style={[
        styles.goalCard,
        isCompleted && styles.goalCardDone,
        glowStyle,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Gradient accent top bar */}
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={
          isCompleted
            ? [colors.success, colors.success + "40"]
            : [colors.primary, colors.primary + "40"]
        }
        style={styles.cardAccent}
      />

      <View style={styles.cardInner}>
        <View style={styles.goalCardTop}>
          <View style={[styles.orderBadge, { backgroundColor: (orderColor || colors.primary) + "20" }]}>
            <AppText style={[styles.goalOrderText, { color: orderColor || colors.primary }]}>
              #{index + 1}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Ionicons name={statusIcon} size={11} color={statusColor} />
            <AppText style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusLabel}
            </AppText>
          </View>
        </View>

        {/* Decorative icon */}
        <View style={styles.cardIconWrap}>
          <LinearGradient
            colors={
              isCompleted
                ? [colors.success + "30", colors.success + "08"]
                : [colors.primary + "30", colors.primary + "08"]
            }
            style={styles.cardIconBg}
          >
            <Ionicons
              name={isCompleted ? "checkmark-done-outline" : "flag-outline"}
              size={22}
              color={isCompleted ? colors.success : colors.primary}
            />
          </LinearGradient>
        </View>

        {/* Title */}
        <AppText
          style={[styles.goalCardTitle, isCompleted && styles.goalCardTitleDone]}
          numberOfLines={2}
        >
          {goal.title.toUpperCase()}
        </AppText>

        {/* Description */}
        {goal.description ? (
          <AppText style={styles.goalCardDesc} numberOfLines={3}>
            {goal.description}
          </AppText>
        ) : null}

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {goal.steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <Ionicons
                name={step.completed ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={step.completed ? colors.primary : colors.border}
              />
              <View
                style={[
                  styles.stepIndicatorLine,
                  { backgroundColor: step.completed ? colors.primary : colors.border },
                ]}
              />
            </React.Fragment>
          ))}
          <Ionicons
            name={isCompleted ? "flag" : "flag-outline"}
            size={16}
            color={isCompleted ? colors.success : colors.border}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Modal de detalle: mapa mental tipo canvas ───────────────────────────────

type GoalDetailModalProps = {
  goal: Goal;
  goals: Goal[];
  onClose: () => void;
  onRequestComplete: (goal: Goal) => void;
  addStepToGoal: (goalId: string, title: string, insertAfterIndex: number, description?: string) => Promise<void>;
  removeStep: (stepId: string, goalId: string) => Promise<void>;
  toggleStep: (stepId: string, goalId: string) => Promise<void>;
};

function GoalDetailModal({ goal, goals, onClose, onRequestComplete, addStepToGoal, removeStep, toggleStep }: GoalDetailModalProps) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { triggerNotification } = useNotifications();
  const { showAlert } = useAlert();

  const liveGoal = useMemo(
    () => goals.find((g) => g.id === goal.id) ?? goal,
    [goals, goal]
  );

  const [addStepVisible, setAddStepVisible] = useState(false);
  const [addStepAfterIndex, setAddStepAfterIndex] = useState(-1);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [selectedStep, setSelectedStep] = useState<GoalStep | null>(null);
  const [goalNotes, setGoalNotes] = useState<Note[]>([]);
  const [goalNoteModalVisible, setGoalNoteModalVisible] = useState(false);

  useEffect(() => {
    getNotesForEntity("goal", goal.id).then(setGoalNotes);
  }, [goal.id]);

  // Feedback visual al exportar a tareas: el botón se vuelve check durante 1.5s.
  // Vive en el modal padre y se pasa como flag a cada StepPill.
  const [exportedStepId, setExportedStepId] = useState<string | null>(null);
  const exportTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    };
  }, []);

  const steps = liveGoal.steps;
  const isCompleted = liveGoal.status === "completed";
  const allStepsCompleted =
    steps.length === 0 || steps.every((s) => s.completed);

  const createdLabel = useMemo(
    () => formatLongDate(liveGoal.createdAt),
    [liveGoal.createdAt]
  );

  const handleAddStepRequest = (afterNodeIndex: number) => {
    // El canvas invierte el orden de los pasos: la meta va arriba, el
    // nodo de inicio abajo, y los pasos se ordenan de ultimo a primero
    // de arriba hacia abajo. Por eso el indice visual se invierte:
    // afterNodeIndex=0 (gap tras la meta) corresponde a insertar al
    // final del array de pasos (steps.length-1), mientras que
    // afterNodeIndex=steps.length (gap tras el ultimo paso) corresponde
    // al inicio del array (insertAfterIndex=-1).
    const insertAfterIndex = steps.length - 1 - afterNodeIndex;
    setAddStepAfterIndex(insertAfterIndex);
    setNewStepTitle("");
    setNewStepDescription("");
    setAddStepVisible(true);
  };

  const handleConfirmAddStep = async () => {
    const title = newStepTitle.trim();
    if (!title) {
      setAddStepVisible(false);
      return;
    }
    const desc = newStepDescription.trim() || undefined;
    try {
      await addStepToGoal(liveGoal.id, title, addStepAfterIndex, desc);
      triggerNotification("Paso añadido", "success");
    } catch (err: unknown) {
      triggerNotification(err instanceof Error ? err.message : "Error al añadir paso", "warning");
    }
    setAddStepVisible(false);
    setNewStepTitle("");
    setNewStepDescription("");
  };

  const handleToggle = async (step: GoalStep) => {
    if (step.completed) return;
    showAlert(
      "Completar paso",
      `¿Marcar "${step.title}" como completado? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Completar",
          onPress: async () => {
            try {
              await toggleStep(step.id, liveGoal.id);
            } catch (err: unknown) {
              triggerNotification(err instanceof Error ? err.message : "Transición inválida", "warning");
            }
          },
        },
      ]
    );
  };

  const handleStepLongPress = (step: GoalStep) => {
    setSelectedStep(step);
  };

  const handleDeleteStep = async () => {
    if (!selectedStep) return;
    try {
      await removeStep(selectedStep.id, liveGoal.id);
      setSelectedStep(null);
    } catch (err: unknown) {
      triggerNotification(err instanceof Error ? err.message : "No se puede eliminar", "warning");
    }
  };

  const handleExportToTask = (step: GoalStep) => {
    showAlert(
      "Exportar a tarea",
      `¿Añadir "${step.title}" a la lista de tareas?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Añadir",
          onPress: async () => {
            try {
              await addTask(step.title);
              triggerNotification(`"${step.title}" enviado a tareas`, "success");
              if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
              setExportedStepId(step.id);
              exportTimerRef.current = setTimeout(() => {
                setExportedStepId(null);
                exportTimerRef.current = null;
              }, 1500);
            } catch {
              triggerNotification("No se pudo exportar a tareas", "warning");
            }
          },
        },
      ]
    );
  };

  const handleGoalTap = () => {
    if (isCompleted) {
      triggerNotification("Esta meta ya está completada", "info");
      return;
    }
    if (!allStepsCompleted) {
      triggerNotification(
        "Completa todos los pasos antes de finalizar",
        "warning"
      );
      return;
    }
    onRequestComplete(liveGoal);
  };

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.detailContainer}>
        {/* Fondo con gradiente diagonal y manchas suaves */}
        <DetailBackground colors={colors} />
        <View style={styles.detailContentColumn}>
          {/* Top bar */}
          <View style={styles.detailTopBar}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={styles.detailTitle} numberOfLines={1}>
                {liveGoal.title}
              </AppText>
              {liveGoal.description ? (
                <AppText style={styles.detailDescription} numberOfLines={2}>
                  {liveGoal.description}
                </AppText>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.detailCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Notas vinculadas a la meta */}
          <View style={styles.goalNotesRow}>
            {goalNotes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {goalNotes.map((note) => (
                  <View key={note.id} style={styles.goalNoteChip}>
                    <Ionicons name="document-text-outline" size={12} color={colors.primary} />
                    <AppText style={styles.goalNoteChipText} numberOfLines={1}>
                      {note.title || note.content.split("\n")[0]}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            <TouchableOpacity onPress={() => setGoalNoteModalVisible(true)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Canvas con nodos posicionados y curvas SVG */}
          <MindMapCanvas
            steps={steps}
            goalTitle={liveGoal.title}
            goalDescription={liveGoal.description}
            createdLabel={createdLabel}
            isCompleted={isCompleted}
            allStepsCompleted={allStepsCompleted}
            onToggleStep={handleToggle}
            onStepLongPress={handleStepLongPress}
            onExportToTask={handleExportToTask}
            onAddStepRequest={handleAddStepRequest}
            onGoalTap={handleGoalTap}
            colors={colors}
            styles={styles}
          />
        </View>
      </View>

      {/* Modal para crear paso intermedio */}
      <AddStepModal
        visible={addStepVisible}
        title={newStepTitle}
        description={newStepDescription}
        onChangeTitle={setNewStepTitle}
        onChangeDescription={setNewStepDescription}
        onConfirm={handleConfirmAddStep}
        onCancel={() => {
          setAddStepVisible(false);
          setNewStepTitle("");
          setNewStepDescription("");
        }}
      />

      {/* Card flotante con info del paso */}
      {selectedStep ? (
        <StepInfoCard
          step={selectedStep}
          onClose={() => setSelectedStep(null)}
          onDelete={handleDeleteStep}
          onExport={() => handleExportToTask(selectedStep)}
        />
      ) : null}

      <NoteModal
        visible={goalNoteModalVisible}
        note={null}
        prefillLinks={[{ entityType: "goal", entityId: goal.id }]}
        onSave={async (data) => {
          await storageAddNote(data.content, data.title || null, data.pinned, [
            ...data.links,
            { entityType: "goal" as const, entityId: goal.id },
          ]);
          const updated = await getNotesForEntity("goal", goal.id);
          setGoalNotes(updated);
          setGoalNoteModalVisible(false);
        }}
        onClose={() => setGoalNoteModalVisible(false)}
      />
    </Modal>
  );
}

// ─── Fondo con gradiente y manchas ───────────────────────────────────────────

function DetailBackground({ colors }: { colors: ThemeColors }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, overflow: "hidden" }]} pointerEvents="none">
      {/* Diamante grande arriba a la derecha */}
      <View
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 180,
          height: 180,
          backgroundColor: colors.primary,
          opacity: 0.08,
          transform: [{ rotate: "45deg" }],
        }}
      />
      {/* Círculo con borde abajo a la izquierda */}
      <View
        style={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          borderWidth: 3,
          borderColor: colors.accentBlue,
          opacity: 0.12,
        }}
      />
      {/* Triángulo esquinado arriba a la izquierda */}
      <View
        style={{
          position: "absolute",
          top: 80,
          left: -30,
          width: 0,
          height: 0,
          borderLeftWidth: 80,
          borderRightWidth: 80,
          borderBottomWidth: 140,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: colors.success,
          opacity: 0.07,
          transform: [{ rotate: "-15deg" }],
        }}
      />
      {/* Círculo pequeño a la derecha */}
      <View
        style={{
          position: "absolute",
          bottom: 160,
          right: 30,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.warning,
          opacity: 0.1,
      }}
      />
      {/* Hexágono simulado abajo */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          right: "35%",
          width: 100,
          height: 100,
          borderRadius: 16,
          backgroundColor: colors.error,
          opacity: 0.06,
          transform: [{ rotate: "30deg" }],
        }}
      />
      {/* Anillos concéntricos en el centro-izquierda */}
      <View
        style={{
          position: "absolute",
          top: 280,
          left: 50,
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: colors.primary,
          opacity: 0.09,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 288,
          left: 58,
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 1.5,
          borderColor: colors.primary,
          opacity: 0.06,
        }}
      />
      {/* Rombo pequeño centrado-derecha */}
      <View
        style={{
          position: "absolute",
          top: 440,
          left: 240,
          width: 50,
          height: 50,
          backgroundColor: colors.accentBlue,
          opacity: 0.07,
          transform: [{ rotate: "15deg" }],
        }}
      />
      {/* Línea decorativa en el centro */}
      <View
        style={{
          position: "absolute",
          top: 180,
          left: 290,
          width: 2,
          height: 120,
          borderRadius: 1,
          backgroundColor: colors.success,
          opacity: 0.08,
          transform: [{ rotate: "25deg" }],
        }}
      />
    </View>
  );
}

// ─── Canvas mental: nodos + curvas SVG ──────────────────────────────────────

type CanvasProps = {
  steps: GoalStep[];
  goalTitle: string;
  goalDescription?: string;
  createdLabel: string;
  isCompleted: boolean;
  allStepsCompleted: boolean;
  onToggleStep: (step: GoalStep) => void;
  onStepLongPress: (step: GoalStep) => void;
  onExportToTask: (step: GoalStep) => void;
  onAddStepRequest: (afterNodeIndex: number) => void;
  onGoalTap: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
};

type PlacedNode = {
  id: string;
  kind: "start" | "step" | "goal";
  x: number;
  y: number;
  step?: GoalStep;
};

function MindMapCanvas(props: CanvasProps) {
  const {
    steps,
    goalTitle,
    goalDescription,
    createdLabel,
    isCompleted,
    allStepsCompleted,
    onToggleStep,
    onStepLongPress,
    onExportToTask,
    onAddStepRequest,
    onGoalTap,
    colors,
    styles,
  } = props;

  const [size, setSize] = useState({ w: 0, h: 0 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  // Altura dinámica del contenido: se estira para dar espacio a muchos pasos
  const STEP_SPACING = 130;
  const TOP_EXTRA = 100;
  const BOTTOM_EXTRA = 80;
  const contentHeight = useMemo(
    () => Math.max(size.h, TOP_EXTRA + steps.length * STEP_SPACING + BOTTOM_EXTRA),
    [size.h, steps.length]
  );

  const nodes: PlacedNode[] = useMemo(
    () => computeNodeLayout(size.w, contentHeight, steps),
    [size.w, contentHeight, steps]
  );

  const connectors = useMemo(() => buildConnectors(nodes, colors), [nodes, colors]);
  const addButtons = useMemo(() => buildAddButtons(nodes), [nodes]);

  return (
    <ScrollView
      style={styles.canvas}
      contentContainerStyle={{
        width: size.w,
        height: contentHeight,
      }}
      onLayout={handleLayout}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      {size.w > 0 && size.h > 0 ? (
        <>
          <Svg
            width={size.w}
            height={contentHeight}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {connectors.map((c, i) => (
              <Path
                key={`c-${i}`}
                d={c.d}
                stroke={c.color}
                strokeWidth={2}
                fill="none"
                strokeOpacity={c.opacity}
                strokeLinecap="round"
              />
            ))}
          </Svg>

          {nodes.map((n) => (
            <PositionedNode key={n.id} x={n.x} y={n.y}>
              {n.kind === "start" ? (
                <StartPill label={`Inicio · ${createdLabel}`} colors={colors} styles={styles} />
              ) : n.kind === "step" && n.step ? (
                <StepPill
                  step={n.step}
                  onToggle={() => onToggleStep(n.step!)}
                  onLongPress={() => onStepLongPress(n.step!)}
                  colors={colors}
                  styles={styles}
                />
              ) : (
                <GoalPill
                  title={goalTitle}
                  description={goalDescription}
                  isCompleted={isCompleted}
                  canFinalize={allStepsCompleted && !isCompleted}
                  onTap={onGoalTap}
                  colors={colors}
                  styles={styles}
                />
              )}
            </PositionedNode>
          ))}

          {addButtons.map((b) => (
            <PositionedNode key={b.id} x={b.x} y={b.y}>
              <AddStepDot onPress={() => onAddStepRequest(b.afterNodeIndex)} colors={colors} styles={styles} />
            </PositionedNode>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

function computeNodeLayout(
  width: number,
  height: number,
  steps: GoalStep[]
): PlacedNode[] {
  if (width <= 0 || height <= 0) return [];

  const cx = width / 2;
  const topY = 36;
  const bottomY = height - 40;
  const usableH = Math.max(0, bottomY - topY);

  // Mitades de ancho de cada tipo de pill. Deben coincidir con los maxWidth
  // definidos en los estilos de cada componente (step=200, goal=260, start=180).
  const STEP_HALF = 117; // (200 + 6 + 28) / 2
  const GOAL_HALF = 130; // 260 / 2
  const START_HALF = 90; // 180 / 2

  const nodes: PlacedNode[] = [];
  // Layout invertido: la meta principal va arriba, el nodo de inicio al fondo.
  // Esto crea un flujo visual ascendente que refleja la progresion logica
  // (los pasos de indice menor se completan primero y estan mas cerca del inicio).
  nodes.push({ id: "goal", kind: "goal", x: clampX(cx, width, GOAL_HALF), y: topY });

  if (steps.length === 0) {
    nodes.push({ id: "start", kind: "start", x: clampX(cx, width, START_HALF), y: bottomY });
    return nodes;
  }

  // Distribucion vertical proporcional al numero de pasos.
  // Step 0 (el que se completa primero, indice menor) va cerca del inicio (abajo).
  // Step N-1 (el ultimo en completarse) va cerca de la meta (arriba).
  // El zigzag horizontal alterna entre 30% y 70% del ancho con una leve
  // oscilacion sinusoidal para evitar que los pills se vean monotonos.
  for (let i = 0; i < steps.length; i += 1) {
    const y = topY + ((steps.length - i) * usableH) / (steps.length + 1);
    const baseFrac = i % 2 === 0 ? 0.3 : 0.7;
    const wave = 0.04 * Math.sin((i + 1) * 1.7);
    const xFrac = clamp(baseFrac + wave, 0.18, 0.82);
    const x = clampX(xFrac * width, width, STEP_HALF);
    nodes.push({ id: steps[i].id, kind: "step", x, y, step: steps[i] });
  }

  nodes.push({ id: "start", kind: "start", x: clampX(cx, width, START_HALF), y: bottomY });

  // Ordenar nodos por Y para que los conectores fluyan de forma monotónica
  // (de arriba a abajo) sin ir y volver. El orden del array determina cómo
  // se dibujan las líneas entre nodos; si no está ordenado por Y, las
  // curvas se cruzan y el diagrama se ve desordenado.
  nodes.sort((a, b) => a.y - b.y);

  return nodes;
}

// Centra un nodo de halfWidth `half` dentro del canvas; lo empuja hacia
// el centro si quedaría fuera de los bordes.
function clampX(x: number, width: number, half: number): number {
  return Math.max(half, Math.min(width - half, x));
}

type Connector = { d: string; color: string; opacity: number };

function buildConnectors(nodes: PlacedNode[], colors: ThemeColors): Connector[] {
  const out: Connector[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const nextStep = b.kind === "step" ? b.step : undefined;
    const isCompletedFlow = nextStep?.completed ?? false;
    out.push({
      d: getCurvePath(a, b, i),
      color: isCompletedFlow ? colors.success : colors.textSecondary,
      // El primer trazo sale de la meta: ligeramente más suave para dar
      // jerarquía visual. El resto va a 0.55.
      opacity: a.kind === "goal" ? 0.5 : 0.55,
    });
  }
  return out;
}

type AddButton = { id: string; x: number; y: number; afterNodeIndex: number };

function buildAddButtons(nodes: PlacedNode[]): AddButton[] {
  const out: AddButton[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const mid = midpoint(a, b, i);
    out.push({
      id: `add-${i}`,
      x: mid.x,
      y: mid.y,
      afterNodeIndex: i,
    });
  }
  return out;
}

// Calcula el punto medio de la curva Bezier entre dos nodos, usado para
// posicionar los botones "+" en los gaps. Usa la formula del centroide
// de una curva cubica en t=0.5: (P0 + 3*P1 + 3*P2 + P3) / 8.
function midpoint(a: PlacedNode, b: PlacedNode, idx: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const cp = curveCP(a, dx, dy, len, idx);
  const mx = (a.x + 3 * cp.cpx1 + 3 * cp.cpx2 + b.x) / 8;
  const my = (a.y + 3 * cp.cpy1 + 3 * cp.cpy2 + b.y) / 8;
  return { x: mx, y: my };
}

function getCurvePath(a: PlacedNode, b: PlacedNode, idx: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const cp = curveCP(a, dx, dy, len, idx);
  return `M ${a.x} ${a.y} C ${cp.cpx1} ${cp.cpy1} ${cp.cpx2} ${cp.cpy2} ${b.x} ${b.y}`;
}

// Calcula puntos de control para curvas cubicas Bezier con curvatura
// perpendicular alternante (el signo de idx%2 inverte la direccion).
// Esto crea un flujo organico tipo mapa mental donde las curvas se
// abren hacia izquierda o derecha alternadamente, evitando que se
// superpongan visualmente. El parametro idx determina el sentido
// de la curvatura para cada par de nodos consecutivos.
function curveCP(
  a: PlacedNode, dx: number, dy: number, len: number, idx: number
) {
  const scale = Math.min(48, len * 0.16) * (idx % 2 === 0 ? 1 : -1);
  const perpX = -dy / len * scale;
  const perpY = dx / len * scale;
  return {
    cpx1: a.x + dx * 0.3 + perpX,
    cpy1: a.y + dy * 0.3 + perpY,
    cpx2: a.x + dx * 0.7 + perpX,
    cpy2: a.y + dy * 0.7 + perpY,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ─── Nodos posicionados (wrapper con auto-medición) ──────────────────────────

function PositionedNode({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h) {
          setSize({ w: width, h: height });
        }
      }}
      style={{
        position: "absolute",
        left: size.w > 0 ? x - size.w / 2 : -9999,
        top: size.h > 0 ? y - size.h / 2 : -9999,
        opacity: size.w > 0 && size.h > 0 ? 1 : 0,
      }}
      pointerEvents="box-none"
    >
      {children}
    </View>
  );
}

// ─── Tipos de nodo ───────────────────────────────────────────────────────────

function StartPill({
  label,
  colors,
  styles,
}: {
  label: string;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.startPill}>
      <View style={[styles.startIcon, { backgroundColor: colors.surface, borderColor: colors.textSecondary }]}>
        <Ionicons name="play" size={14} color={colors.textSecondary} />
      </View>
      <AppText style={styles.startLabel}>
        {label}
      </AppText>
    </View>
  );
}

type StepPillProps = {
  step: GoalStep;
  onToggle: () => void;
  onLongPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
};

function StepPill({ step, onToggle, onLongPress, colors, styles }: StepPillProps) {
  const isDone = step.completed;
  return (
    <View style={styles.stepPillWrap}>
      <TouchableOpacity
        activeOpacity={isDone ? 1 : 0.85}
        onPress={isDone ? undefined : onToggle}
        onLongPress={onLongPress}
        delayLongPress={500}
        style={[
          styles.stepPill,
          isDone ? styles.stepPillDone : styles.stepPillActive,
        ]}
      >
        <View style={styles.stepPillInner}>
          <View style={styles.stepPillHeaderRow}>
            <View
              style={[
                styles.stepDot,
                isDone
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : { backgroundColor: colors.surface, borderColor: colors.primary },
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={14} color={colors.surface} />
              ) : (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </View>
            <AppText
              style={[styles.stepText, isDone && styles.stepTextDone]}
            >
              {step.title}
            </AppText>
          </View>
          {step.description ? (
            <AppText style={styles.stepDescription} numberOfLines={4}>
              {step.description}
            </AppText>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function GoalPill({
  title,
  description,
  isCompleted,
  canFinalize,
  onTap,
  colors,
  styles,
}: {
  title: string;
  description?: string;
  isCompleted: boolean;
  canFinalize: boolean;
  onTap: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  const bg = isCompleted
    ? colors.success
    : canFinalize
    ? colors.primary
    : colors.border;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onTap}
      disabled={isCompleted}
      style={[
        styles.goalPill,
        { backgroundColor: bg, borderColor: bg },
      ]}
    >
      <View style={styles.goalPillInner}>
        <View style={styles.goalPillHeaderRow}>
          <Ionicons
            name={isCompleted ? "checkmark" : "flag"}
            size={20}
            color={colors.surface}
          />
          <AppText style={styles.goalPillText}>
            {title}
          </AppText>
        </View>
        {description ? (
          <AppText style={styles.goalPillDescription} numberOfLines={6}>
            {description}
          </AppText>
        ) : null}
        <AppText style={styles.goalPillHint}>
          {isCompleted
            ? "Completada"
            : canFinalize
            ? "Toca para finalizar"
            : "Bloqueada"}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

function AddStepDot({
  onPress,
  colors,
  styles,
}: {
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        styles.addStepDot,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
        },
      ]}
    >
      <Ionicons name="add" size={11} color={colors.primary} />
    </TouchableOpacity>
  );
}

// ─── Modal para crear paso intermedio ───────────────────────────────────────

function AddStepModal({
  visible,
  title,
  description,
  onChangeTitle,
  onChangeDescription,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description: string;
  onChangeTitle: (t: string) => void;
  onChangeDescription: (t: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.stepModalView}
        >
          <AppText style={styles.stepModalTitle}>Nuevo paso intermedio</AppText>
          <AppText style={styles.stepModalSubtitle}>
            Define un paso que te acerque a la meta. La descripción es opcional.
          </AppText>
          <TextInput
            autoFocus
            style={styles.input}
            placeholder="Título (obligatorio)"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={onChangeTitle}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
            placeholder="Descripción (opcional)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={onChangeDescription}
            multiline
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />
          <View style={styles.stepModalActions}>
            <TouchableOpacity
              style={[styles.stepModalBtn, { borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <AppText style={[styles.stepModalBtnText, { color: colors.textSecondary }]}>
                Cancelar
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepModalBtn, { backgroundColor: colors.primary }]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <AppText style={[styles.stepModalBtnText, { color: colors.surface }]}>
                Agregar
              </AppText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Card flotante con info del paso ───────────────────────────────────────

function StepInfoCard({
  step,
  onClose,
  onDelete,
  onExport,
}: {
  step: GoalStep;
  onClose: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const isDone = step.completed;
  const { glowStyle } = useGlow();

  const [stepNotes, setStepNotes] = useState<Note[]>([]);
  const [stepNoteModalVisible, setStepNoteModalVisible] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    getNotesForEntity("goal_step", step.id).then(setStepNotes);
  }, [step.id]);

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.stepInfoOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <GlowView style={styles.stepInfoCard} cardRadius={12}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* Close X button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.stepInfoCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Header with icon + title */}
            <View style={styles.stepInfoHeader}>
              <View
                style={[
                  styles.stepInfoDot,
                  isDone
                    ? { backgroundColor: colors.success, borderColor: colors.success }
                    : { backgroundColor: colors.surface, borderColor: colors.primary },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={16} color={colors.surface} />
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                )}
              </View>
              <AppText style={styles.stepInfoTitle}>{step.title}</AppText>
            </View>

            {/* Description */}
            {step.description ? (
              <View style={styles.stepInfoDescWrap}>
                <ScrollView
                  style={styles.stepInfoDescScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  <AppText style={styles.stepInfoDesc}>
                    {step.description}
                  </AppText>
                </ScrollView>
              </View>
            ) : null}

            {/* Linked notes */}
            <View style={styles.stepInfoNotesWrap}>
              <AppText style={styles.stepInfoNotesLabel}>Notas</AppText>
              {stepNotes.length === 0 ? (
                <AppText style={styles.stepInfoNotesEmpty}>Sin notas vinculadas</AppText>
              ) : (
                stepNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.linkedNoteRow}
                    onPress={() => setViewingNote(note)}
                    onLongPress={() => setEditingNote(note)}
                  >
                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                    <AppText style={styles.linkedNoteText} numberOfLines={1}>
                      {note.title || note.content.split("\n")[0]}
                    </AppText>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.addLinkedNoteBtn}
                onPress={() => setStepNoteModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
                <AppText style={styles.addLinkedNoteText}>Agregar nota</AppText>
              </TouchableOpacity>
            </View>

            {/* Actions row: export + delete */}
            <View style={styles.stepInfoActions}>
              {!isDone && (
                <>
                  <TouchableOpacity
                    style={styles.stepInfoExportBtn}
                    onPress={onExport}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} />
                    <AppText style={styles.stepInfoExportText}>Exportar a tareas</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepInfoDeleteBtn}
                    onPress={onDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <AppText style={styles.stepInfoDeleteText}>Eliminar</AppText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
        </GlowView>
      </TouchableOpacity>

      <NoteModal
        visible={stepNoteModalVisible || editingNote !== null}
        note={editingNote}
        prefillLinks={[{ entityType: "goal_step", entityId: step.id }]}
        onSave={async (data) => {
          if (editingNote) {
            const { updateNote, updateNoteLinks } = await import("../lib/storage/notes");
            await updateNote(editingNote.id, {
              title: data.title || null,
              content: data.content,
              pinned: data.pinned,
            });
            await updateNoteLinks(editingNote.id, data.links);
          } else {
            await storageAddNote(data.content, data.title || null, data.pinned, [
              ...data.links,
              { entityType: "goal_step" as const, entityId: step.id },
            ]);
          }
          const updated = await getNotesForEntity("goal_step", step.id);
          setStepNotes(updated);
          setEditingNote(null);
          setStepNoteModalVisible(false);
        }}
        onClose={() => { setEditingNote(null); setStepNoteModalVisible(false); }}
      />

      {/* Note viewer modal */}
      <Modal visible={viewingNote !== null} transparent animationType="fade" onRequestClose={() => setViewingNote(null)}>
        <TouchableOpacity style={styles.noteViewerOverlay} activeOpacity={1} onPress={() => setViewingNote(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.noteViewerCard, glowStyle]}>
            <View style={styles.noteViewerHeader}>
              <AppText style={styles.noteViewerTitle} numberOfLines={2}>
                {viewingNote?.title || "Sin título"}
              </AppText>
              <TouchableOpacity onPress={() => setViewingNote(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.noteViewerBody}>
              <AppText style={styles.noteViewerContent}>{viewingNote?.content}</AppText>
              <AppText style={styles.noteViewerDate}>
                {viewingNote ? new Date(viewingNote.createdAt).toLocaleDateString("es", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                }) : ""}
              </AppText>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

// ─── Modal de confirmación / felicitación ────────────────────────────────────

function CompletionModal({
  goal,
  onConfirm,
  onCancel,
}: {
  goal: Goal;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <GlowView style={styles.confirmCard} cardRadius={12}>
          <View style={[styles.confirmIconWrap, { backgroundColor: colors.primary }]}>
            <Ionicons name="trophy" size={36} color={colors.surface} />
          </View>
          <AppText style={styles.confirmTitle}>¡Felicidades!</AppText>
          <AppText style={styles.confirmBody}>
            Has alcanzado la meta{" "}
            <AppText style={styles.confirmHighlight}>“{goal.title}”</AppText>.
            Este logro es el resultado de tu disciplina, tu constancia y el
            esfuerzo que has sostenido paso a paso. Permítete reconocer el
            camino recorrido: cada uno de los pasos intermedios que completaste
            te trajo hasta aquí, y eso merece celebrarse.
          </AppText>
          <AppText style={styles.confirmReward}>+50 puntos</AppText>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.confirmCancel} onPress={onCancel}>
              <AppText style={styles.confirmCancelText}>Cancelar</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmOk} onPress={onConfirm}>
              <AppText style={styles.confirmOkText}>Marcar como completada</AppText>
            </TouchableOpacity>
          </View>
        </GlowView>
      </View>
    </Modal>
  );
}

// ─── Dashboard de meta completada ───────────────────────────────────────────

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function CompletedGoalDashboard({
  goal,
  onClose,
}: {
  goal: Goal;
  onClose: () => void;
}) {
  const colors = useTheme();
  const styles = getStyles(colors);

  const completedAt = goal.completedAt || goal.createdAt;
  const totalMs =
    new Date(completedAt).getTime() - new Date(goal.createdAt).getTime();

  let prevTime = new Date(goal.createdAt).getTime();
  const stepTimings = goal.steps.map((step) => {
    const unlocked = step.unlockedAt
      ? new Date(step.unlockedAt).getTime()
      : null;
    const durationMs = unlocked ? unlocked - prevTime : 0;
    if (unlocked) prevTime = unlocked;
    return { step, durationMs };
  });

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.detailContainer}>
        <DetailBackground colors={colors} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.dashboardContent}
        >
          {/* Header */}
          <View style={styles.dashboardHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={styles.dashboardTitle}>{goal.title}</AppText>
              {goal.description ? (
                <AppText style={styles.dashboardDesc}>{goal.description}</AppText>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.detailCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stats grid */}
          <View style={styles.dashboardStatsGrid}>
            <GlowView style={[styles.dashboardStatCard, { borderLeftColor: colors.success }]} cardRadius={12}>
              <Ionicons name="checkmark-done" size={22} color={colors.success} />
              <AppText style={styles.dashboardStatValue}>{goal.steps.length}</AppText>
              <AppText style={styles.dashboardStatLabel}>Pasos</AppText>
            </GlowView>
            <GlowView style={[styles.dashboardStatCard, { borderLeftColor: colors.primary }]} cardRadius={12}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <AppText style={styles.dashboardStatValue}>{formatDuration(totalMs)}</AppText>
              <AppText style={styles.dashboardStatLabel}>Duración total</AppText>
            </GlowView>
          </View>

          {/* Dates */}
          <GlowView style={styles.dashboardDatesCard} cardRadius={12}>
            <View style={styles.dashboardDateRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <AppText style={styles.dashboardDateText}>
                Creada: {formatLongDate(goal.createdAt)}
              </AppText>
            </View>
            <View style={styles.dashboardDateRow}>
              <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
              <AppText style={styles.dashboardDateText}>
                Completada: {formatLongDate(completedAt)}
              </AppText>
            </View>
          </GlowView>

          {/* Timeline */}
          <AppText style={styles.dashboardSectionTitle}>Línea de tiempo</AppText>
          {stepTimings.map(({ step, durationMs }, i) => (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <GlowView style={styles.timelineContent} cardRadius={12}>
                <AppText style={styles.timelineStepTitle}>{step.title}</AppText>
                <AppText style={styles.timelineDuration}>
                  {i === 0
                    ? `Desde el inicio · ${formatDuration(durationMs)}`
                    : `${formatDuration(durationMs)} después del paso anterior`}
                </AppText>
              </GlowView>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    pointsBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    pointsText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    errorBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      flex: 1,
    },


    goalsList: {
      gap: 16,
    },
    cardWrap: {
      borderRadius: 20,
    },
    cardWrapPicked: {
      transform: [{ scale: 1.03 }],
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 22,
    },
    actionHint: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 14,
    },
    floatingToolbar: {
      position: "absolute",
      bottom: 96,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 14,
    },
    floatingToolBtn: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    floatingToolActive: {
      transform: [{ scale: 1.18 }],
      borderWidth: 2.5,
      borderColor: colors.primary,
    },
    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardAccent: {
      height: 4,
    },
    cardInner: {
      padding: 18,
    },
    goalCardDone: {},
    goalCardPicked: {
      transform: [{ scale: 1.03 }],
      borderWidth: 2,
      borderColor: colors.primary,
    },
    goalCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    orderBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    goalOrderText: {
      fontSize: 13,
      fontWeight: "800",
    },
    cardIconWrap: {
      alignItems: "center",
      marginBottom: 12,
      marginTop: 10,
    },
    cardIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    goalCardTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    goalCardTitleDone: {
      color: colors.success,
    },
    goalCardDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      textAlign: "center",
      marginBottom: 10,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: "600",
    },
    stepIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },
    stepIndicatorLine: {
      height: 2,
      flex: 1,
      marginHorizontal: 3,
    },

    fab: {
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

    // Modal crear
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
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    modalScroll: {
      padding: 16,
      gap: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 12,
    },
    saveBtnText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
    },

    // ─── Detalle / canvas ───
    detailContainer: {
      flex: 1,
    },
    detailContentColumn: {
      flex: 1,
    },
    detailTopBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 58 : 44,
      paddingBottom: 6,
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    detailDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    detailCloseBtn: {
      padding: 8,
    },
    canvas: {
      flex: 1,
    },
    blob: {
      position: "absolute",
    },

    // Pills
    // `maxWidth` en vez de `width`: el contenedor se encoje al contenido
    // (flex) y solo se estira hasta el límite cuando el texto es largo.
    startPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 24,
      paddingVertical: 8,
      paddingHorizontal: 14,
      gap: 8,
      maxWidth: 180,
    },
    startIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    startLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
      maxWidth: 138, // 180 pill - 28 padding - 14 icon - gap
    },

    stepPillWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stepPill: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 18,
      borderWidth: 1,
      maxWidth: 200,
    },
    stepPillInner: {
      gap: 4,
      alignItems: "center",
    },
    stepPillHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepPillActive: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    stepPillDone: {
      backgroundColor: colors.surface,
      borderColor: colors.success,
    },
    stepDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    stepText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: "500",
      textAlign: "center",
      maxWidth: 146, // 200 pill - 24 padding - 22 dot - 8 gap
    },
    stepTextDone: {
      color: colors.success,
      textDecorationLine: "line-through",
    },
    stepDescription: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
      textAlign: "center",
      maxWidth: 176, // 200 - 24 padding
    },

    goalPill: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      maxWidth: 260,
    },
    goalPillInner: {
      gap: 4,
      alignItems: "center",
    },
    goalPillHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    goalPillText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.surface,
      textAlign: "center",
      maxWidth: 198, // 260 pill - 32 padding - 20 icon - 10 gap
    },
    goalPillDescription: {
      fontSize: 12,
      color: colors.surface + "EB",
      lineHeight: 16,
      textAlign: "center",
      maxWidth: 228,
    },
    goalPillHint: {
      fontSize: 10,
      color: colors.surface + "D9",
      textAlign: "center",
      marginTop: 2,
    },

    // ─── Card flotante info paso ───
    stepInfoOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    stepInfoCard: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.surface + "F2",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border + "80",
      padding: 24,
      paddingTop: 20,
    },
    stepInfoCloseBtn: {
      position: "absolute",
      top: -4,
      right: -4,
      zIndex: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepInfoHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
      paddingRight: 32,
    },
    stepInfoDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      flexShrink: 0,
    },
    stepInfoTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    stepInfoDescWrap: {
      backgroundColor: colors.background + "99",
      borderRadius: 14,
      padding: 4,
      marginBottom: 20,
    },
    stepInfoDescScroll: {
      maxHeight: 180,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    stepInfoDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    stepInfoActions: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    stepInfoExportBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + "40",
      backgroundColor: colors.primary + "0A",
    },
    stepInfoExportText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    stepInfoDeleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error + "40",
      backgroundColor: "transparent",
    },
    stepInfoDeleteText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.error,
    },
    stepInfoBtnText: {
      fontSize: 14,
      fontWeight: "600",
    },

    addStepDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
    },

    // ─── Modal crear paso ───
    stepModalView: {
      backgroundColor: colors.surface,
      margin: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 8,
    },
    stepModalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    stepModalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    stepModalActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    stepModalBtn: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 11,
      alignItems: "center",
    },
    stepModalBtnText: {
      fontSize: 14,
      fontWeight: "600",
    },

    // ─── Modal confirmación / felicitación ───
    confirmOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    confirmCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: "center",
      gap: 12,
    },
    confirmIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    confirmTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    confirmBody: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
    },
    confirmHighlight: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
    confirmReward: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.success,
      marginTop: 4,
    },
    confirmActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      width: "100%",
    },
    confirmCancel: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    confirmCancelText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    confirmOk: {
      flex: 1.4,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    confirmOkText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "700",
    },

    // ─── Dashboard meta completada ───
    dashboardContent: {
      padding: 24,
      paddingTop: Platform.OS === "ios" ? 58 : 44,
      paddingBottom: 48,
    },
    dashboardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 24,
    },
    dashboardTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    dashboardDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    dashboardStatsGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    dashboardStatCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      padding: 16,
      alignItems: "center",
      gap: 6,
    },
    dashboardStatValue: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    dashboardStatLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    dashboardDatesCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 10,
      marginBottom: 24,
    },
    dashboardDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dashboardDateText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    dashboardSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 14,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      marginBottom: 16,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      marginTop: 4,
    },
    timelineContent: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    timelineStepTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    timelineDuration: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Modal de puntos
    ptsOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    ptsCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },
    ptsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    ptsTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    ptsDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    ptsDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 14,
    },
    ptsSubtitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    ptsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    ptsIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    ptsRowText: {
      flex: 1,
    },
    ptsRowTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    ptsRowDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    ptsBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 11,
      alignItems: "center",
      marginTop: 4,
    },
    ptsBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.surface,
    },

    // Notas vinculadas a meta (GoalDetailModal)
    goalNotesRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    goalNoteChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "0C",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: 6,
    },
    goalNoteChipText: {
      fontSize: 11,
      color: colors.primary,
      maxWidth: 120,
    },

    // Notas vinculadas a paso (StepInfoCard)
    stepInfoNotesWrap: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    stepInfoNotesLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    stepInfoNotesEmpty: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    linkedNoteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    linkedNoteText: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
    },
    addLinkedNoteBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
    },
    addLinkedNoteText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },

    // Note viewer modal
    noteViewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      padding: 24,
    },
    noteViewerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      maxHeight: "70%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteViewerHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    noteViewerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    noteViewerBody: {
      padding: 16,
    },
    noteViewerContent: {
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    noteViewerDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: "right",
    },
  });
}
