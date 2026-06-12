import { Note, NoteLink, NoteEntityType } from "./types";
import { getDb } from "./db";
import { generateId } from "./helpers";

type NoteRow = {
  id: string;
  title: string | null;
  content: string;
  pinned: number;
  created_at: string;
};

function mapNote(row: NoteRow, links: NoteLink[]): Note {
  return {
    id: row.id,
    title: row.title ?? null,
    content: row.content,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    links,
  };
}

// Obtiene los links asociados a una nota (relaciones N:M con tareas y metas).
async function getLinksForNote(noteId: string): Promise<NoteLink[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: number;
    note_id: string;
    entity_type: string;
    entity_id: string;
  }>("SELECT * FROM note_links WHERE note_id = ?", noteId);
  return rows.map((r) => ({
    id: r.id,
    noteId: r.note_id,
    entityType: r.entity_type as NoteEntityType,
    entityId: r.entity_id,
  }));
}

// Resuelve los links de multiples notas en una sola consulta IN(), evitando
// el N+1 que ocurriria si se llamara a getLinksForNote por cada nota.
async function getLinksForNotes(noteIds: string[]): Promise<Map<string, NoteLink[]>> {
  if (noteIds.length === 0) return new Map();
  const db = getDb();
  const placeholders = noteIds.map(() => "?").join(",");
  const rows: {
    id: number;
    note_id: string;
    entity_type: string;
    entity_id: string;
  }[] = await db.getAllAsync(`SELECT * FROM note_links WHERE note_id IN (${placeholders})`, ...noteIds);
  const map = new Map<string, NoteLink[]>();
  for (const noteId of noteIds) map.set(noteId, []);
  for (const r of rows) {
    const links = map.get(r.note_id);
    if (links) {
      links.push({
        id: r.id,
        noteId: r.note_id,
        entityType: r.entity_type as NoteEntityType,
        entityId: r.entity_id,
      });
    }
  }
  return map;
}

// Obtiene todas las notas ordenadas por fijadas primero y luego por fecha descendente.
// Resuelve los links de todas las notas en una sola consulta para evitar N+1.
export async function getNotes(): Promise<Note[]> {
  const db = getDb();
  const rows = await db.getAllAsync<NoteRow>(
    "SELECT * FROM notes ORDER BY pinned DESC, created_at DESC"
  );
  const noteIds = rows.map((r) => r.id);
  const linksMap = await getLinksForNotes(noteIds);
  return rows.map((r) => mapNote(r, linksMap.get(r.id) || []));
}

// Filtra notas vinculadas a una entidad especifica (task, goal, goal_step)
// mediante la tabla intermedia note_links. JOIN interno, no subconsulta.
export async function getNotesForEntity(
  entityType: NoteEntityType,
  entityId: string
): Promise<Note[]> {
  const db = getDb();
  const rows = await db.getAllAsync<NoteRow>(
    `SELECT n.* FROM notes n
     INNER JOIN note_links nl ON nl.note_id = n.id
     WHERE nl.entity_type = ? AND nl.entity_id = ?
     ORDER BY n.pinned DESC, n.created_at DESC`,
    entityType,
    entityId
  );
  const noteIds = rows.map((r) => r.id);
  const linksMap = await getLinksForNotes(noteIds);
  return rows.map((r) => mapNote(r, linksMap.get(r.id) || []));
}

// Busca notas por titulo o contenido usando LIKE. El LIKE con % al inicio
// impide usar indices de SQLite, pero la tabla de notas es lo suficientemente
// pequena como para que no sea un problema en la practica.
export async function searchNotes(query: string): Promise<Note[]> {
  const db = getDb();
  const like = `%${query}%`;
  const rows = await db.getAllAsync<NoteRow>(
    "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY pinned DESC, created_at DESC",
    like,
    like
  );
  const noteIds = rows.map((r) => r.id);
  const linksMap = await getLinksForNotes(noteIds);
  return rows.map((r) => mapNote(r, linksMap.get(r.id) || []));
}

export async function addNote(
  content: string,
  title?: string | null,
  pinned?: boolean,
  links?: { entityType: NoteEntityType; entityId: string }[]
): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      "INSERT INTO notes (id, title, content, pinned, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, title ?? null, content, pinned ? 1 : 0, now]
    );
    if (links && links.length > 0) {
      for (const link of links) {
        await txn.runAsync(
          "INSERT OR IGNORE INTO note_links (note_id, entity_type, entity_id) VALUES (?, ?, ?)",
          [id, link.entityType, link.entityId]
        );
      }
    }
  });
  return id;
}

export async function updateNote(
  id: string,
  fields: { title?: string | null; content?: string; pinned?: boolean }
): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (fields.title !== undefined) {
    sets.push("title = ?");
    params.push(fields.title);
  }
  if (fields.content !== undefined) {
    sets.push("content = ?");
    params.push(fields.content);
  }
  if (fields.pinned !== undefined) {
    sets.push("pinned = ?");
    params.push(fields.pinned ? 1 : 0);
  }
  if (sets.length === 0) return;
  params.push(id);
  await db.runAsync(
    `UPDATE notes SET ${sets.join(", ")} WHERE id = ?`,
    ...params
  );
}

export async function updateNoteLinks(
  noteId: string,
  links: { entityType: NoteEntityType; entityId: string }[]
): Promise<void> {
  const db = getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("DELETE FROM note_links WHERE note_id = ?", noteId);
    for (const link of links) {
      await txn.runAsync(
        "INSERT OR IGNORE INTO note_links (note_id, entity_type, entity_id) VALUES (?, ?, ?)",
        [noteId, link.entityType, link.entityId]
      );
    }
  });
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM note_links WHERE note_id = ?", id);
  await db.runAsync("DELETE FROM notes WHERE id = ?", id);
}
