import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Note, NoteEntityType } from "../lib/storage/types";
import {
  addNote as storageAddNote,
  updateNote as storageUpdateNote,
  deleteNote as storageDeleteNote,
  searchNotes as storageSearchNotes,
  getNotesForEntity as getNotesForEntity,
  updateNoteLinks as storageUpdateNoteLinks,
} from "../lib/storage";
import { getNotes } from "../lib/storage/notes";

// Hook central de notas: soporta CRUD, busqueda por texto, vinculacion a
// entidades (tareas/metas) y pin de notas. Recarga segun el modo activo
// (todas, filtradas por entidad, o por busqueda).
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);

  // Carga notas con tres modos: entityFilter (vinculadas a tarea/meta),
  // searchQuery (busqueda por texto) o todas. entityFilter tiene prioridad
  // sobre searchQuery si ambos se pasan.
  const fetchNotes = useCallback(async (searchQuery?: string | null, entityFilter?: { entityType: NoteEntityType; entityId: string } | null) => {
    try {
      setLoading(true);
      let data: Note[];
      if (entityFilter) {
        data = await getNotesForEntity(entityFilter.entityType, entityFilter.entityId);
      } else if (searchQuery) {
        data = await storageSearchNotes(searchQuery);
      } else {
        data = await getNotes();
      }
      setNotes(data);
    } catch (err: unknown) {
      console.error("useNotes: error fetching notes", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotes(currentSearch);
    }, [fetchNotes, currentSearch])
  );

  // Actualiza el termino de busqueda y recarga. Si query esta vacio,
  // se resetea a null para que fetchNotes cargue todas las notas.
  const search = useCallback(async (query: string) => {
    setCurrentSearch(query.trim() || null);
    await fetchNotes(query.trim() || null);
  }, [fetchNotes]);

  // Crea una nota con contenido, titulo opcional, pin y enlaces.
  // Si el contenido esta vacio, no hace nada (no guarda notas en blanco).
  const addNote = useCallback(
    async (
      content: string,
      title?: string | null,
      pinned?: boolean,
      links?: { entityType: NoteEntityType; entityId: string }[]
    ) => {
      if (!content.trim()) return;
      await storageAddNote(content, title, pinned, links);
      await fetchNotes(currentSearch);
    },
    [fetchNotes, currentSearch]
  );

  // Actualiza titulo, contenido o pin de una nota por ID y recarga.
  const updateNote = useCallback(
    async (
      id: string,
      fields: { title?: string | null; content?: string; pinned?: boolean }
    ) => {
      await storageUpdateNote(id, fields);
      await fetchNotes(currentSearch);
    },
    [fetchNotes, currentSearch]
  );

  // Reemplaza los enlaces de una nota a entidades (reemplazo total).
  const updateLinks = useCallback(
    async (
      noteId: string,
      links: { entityType: NoteEntityType; entityId: string }[]
    ) => {
      await storageUpdateNoteLinks(noteId, links);
      await fetchNotes(currentSearch);
    },
    [fetchNotes, currentSearch]
  );

  // Invierte el estado de pin de una nota y recarga la lista.
  const togglePin = useCallback(
    async (id: string, currentPinned: boolean) => {
      await storageUpdateNote(id, { pinned: !currentPinned });
      await fetchNotes(currentSearch);
    },
    [fetchNotes, currentSearch]
  );

  // Elimina nota por ID y recarga la lista visible.
  const deleteNote = useCallback(
    async (id: string) => {
      await storageDeleteNote(id);
      await fetchNotes(currentSearch);
    },
    [fetchNotes, currentSearch]
  );

  // Cambia el modo a notas vinculadas a una entidad especifica y recarga.
  const loadNotesForEntity = useCallback(
    async (entityType: NoteEntityType, entityId: string) => {
      await fetchNotes(null, { entityType, entityId });
    },
    [fetchNotes]
  );

  // Recarga forzada manteniendo el filtro actual (busqueda o entidad).
  const refresh = useCallback(async () => {
    await fetchNotes(currentSearch);
  }, [fetchNotes, currentSearch]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    updateLinks,
    togglePin,
    deleteNote,
    search,
    loadNotesForEntity,
    refresh,
  };
}
