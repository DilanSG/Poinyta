import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../lib/theme";
import { useNotes } from "../hooks/useNotes";
import { useAlert } from "../components/ui/AlertModal";
import NoteCard from "../components/features/notes/NoteCard";
import NoteModal from "../components/features/notes/NoteModal";
import NoteDetailView from "../components/features/notes/NoteDetailView";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import GlowView from "../components/ui/GlowView";
import AppText from "../components/ui/AppText";
import EmptyState from "../components/ui/EmptyState";
import { Note } from "../lib/storage/types";

export default function NotesScreen() {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { notes, addNote, updateNote, updateLinks, togglePin, deleteNote, search, refresh } = useNotes();
  const { showAlert } = useAlert();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);

  const viewingNote = useMemo(
    () => notes.find((n) => n.id === viewingNoteId) ?? null,
    [notes, viewingNoteId]
  );

  const handleOpenCreate = () => {
    setEditingNote(null);
    setModalVisible(true);
  };

  const handleOpenView = (note: Note) => {
    setViewingNoteId(note.id);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingNote(null);
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    pinned: boolean;
    links: { entityType: "task" | "goal" | "goal_step"; entityId: string }[];
  }) => {
    if (editingNote) {
      await updateNote(editingNote.id, {
        title: data.title || null,
        content: data.content,
        pinned: data.pinned,
      });
      await updateLinks(editingNote.id, data.links);
    } else {
      await addNote(data.content, data.title || null, data.pinned, data.links);
    }
    handleClose();
  };

  const handleSaveDetail = async (
    id: string,
    title: string | null,
    content: string,
    pinned: boolean
  ) => {
    await updateNote(id, { title, content, pinned });
    await refresh();
  };

  const handleDelete = (id: string) => {
    showAlert("Eliminar nota", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteNote(id),
      },
    ]);
  };

  const handlePin = (id: string, currentPinned: boolean) => {
    togglePin(id, currentPinned);
  };

  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter((n) => !n.pinned), [notes]);

  const listData = useMemo(() => {
    const items: ({ type: "header"; label: string } | { type: "note"; note: Note })[] = [];
    if (pinnedNotes.length > 0) {
      items.push({ type: "header", label: "Fijadas" });
      for (const n of pinnedNotes) items.push({ type: "note", note: n });
    }
    if (unpinnedNotes.length > 0) {
      items.push({ type: "header", label: "Otras" });
      for (const n of unpinnedNotes) items.push({ type: "note", note: n });
    }
    return items;
  }, [pinnedNotes, unpinnedNotes]);

  const renderItem = ({
    item,
  }: {
    item: { type: "header"; label: string } | { type: "note"; note: Note };
  }) => {
    if (item.type === "header") {
      return <AppText style={styles.sectionLabel}>{item.label}</AppText>;
    }
    return (
      <NoteCard
        item={item.note}
        onPress={handleOpenView}
        onLongPress={handleOpenEdit}
        onDelete={handleDelete}
        onPin={handlePin}
      />
    );
  };

  if (viewingNote) {
    return (
      <NoteDetailView
        note={viewingNote}
        onSave={handleSaveDetail}
        onClose={() => setViewingNoteId(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundDecor colors={colors} screenVariant={3} />

      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Notas</AppText>
      </View>

      <GlowView style={styles.searchRow} cardRadius={10}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar notas..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            search(text);
          }}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              search("");
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </GlowView>

      <FlatList
        data={listData}
        keyExtractor={(item) =>
          item.type === "header" ? "h-" + item.label : "n-" + item.note.id
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No hay notas aún"
            subtitle="Toca + para crear la primera"
          />
        }
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      <NoteModal
        visible={modalVisible}
        note={editingNote}
        onSave={handleSave}
        onClose={handleClose}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 12,
      height: 40,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 4,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 20,
      backgroundColor: colors.primary,
      borderRadius: 28,
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
