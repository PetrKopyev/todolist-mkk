import type { Note, TodoItem } from "~/types/note";
import type { StoredDraft, StoredNotes } from "~/types/storage";

const NOTES_KEY = "todolist-mkk:notes";
const DRAFT_KEY = "todolist-mkk:draft";
const SCHEMA_VERSION = 1;
const WRITE_DELAY = 400;

const isTodoItem = (value: unknown): value is TodoItem => {
  const item = value as TodoItem;

  return (
    typeof item?.id === "string" &&
    typeof item.text === "string" &&
    typeof item.done === "boolean"
  );
};

const isNote = (value: unknown): value is Note => {
  const note = value as Note;

  return (
    typeof note?.id === "string" &&
    typeof note.title === "string" &&
    typeof note.updatedAt === "number" &&
    Array.isArray(note.todos) &&
    note.todos.every(isTodoItem)
  );
};

const readJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const createWriter = <T>(key: string) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: T | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    pending = null;
  };

  const flush = () => {
    const value = pending;

    cancel();

    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const schedule = (value: T) => {
    pending = value;

    if (!timer) {
      timer = setTimeout(flush, WRITE_DELAY);
    }
  };

  return { cancel, flush, schedule };
};

const notesWriter = createWriter<StoredNotes>(NOTES_KEY);
const draftWriter = createWriter<StoredDraft>(DRAFT_KEY);

type Migration = (payload: unknown) => unknown;

// Миграции из версии N в N + 1. Записи без поля schemaVersion
// считаются версией 0 и прогоняются через всю цепочку.
const migrations: Record<number, Migration> = {
  0: (payload) => payload,
};

const parseVersion = (value: unknown) => {
  const version = Number(value);

  return Number.isFinite(version) ? version : 0;
};

const migrateToCurrent = (version: number, payload: unknown): unknown => {
  let result = payload;
  let current = version;

  while (current < SCHEMA_VERSION) {
    result = migrations[current]?.(result) ?? result;
    current += 1;
  }

  return result;
};

const readNotes = () => {
  const { schemaVersion, notes } = (readJson(NOTES_KEY) ??
    {}) as Partial<StoredNotes>;

  if (!Array.isArray(notes)) {
    return [];
  }

  const version = parseVersion(schemaVersion);

  if (version > SCHEMA_VERSION) {
    return [];
  }

  return (migrateToCurrent(version, notes) as unknown[]).filter(isNote);
};

const readDraft = (noteId: string) => {
  const { schemaVersion, note } = (readJson(DRAFT_KEY) ??
    {}) as Partial<StoredDraft>;

  const version = parseVersion(schemaVersion);

  if (version > SCHEMA_VERSION) {
    return null;
  }

  const migrated = migrateToCurrent(version, note);

  return isNote(migrated) && migrated.id === noteId ? migrated : null;
};

const scheduleNotesWrite = (notes: Note[]) => {
  notesWriter.schedule({ schemaVersion: SCHEMA_VERSION, notes });
};

const scheduleDraftWrite = (note: Note) => {
  draftWriter.schedule({ schemaVersion: SCHEMA_VERSION, note });
};

const clearDraft = () => {
  draftWriter.cancel();
  localStorage.removeItem(DRAFT_KEY);
};

const flushWrites = () => {
  notesWriter.flush();
  draftWriter.flush();
};

const subscribeToExternalChanges = (onChange: (notes: Note[]) => void) => {
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === NOTES_KEY) {
      onChange(readNotes());
    }
  });
};

export {
  clearDraft,
  flushWrites,
  readDraft,
  readNotes,
  scheduleDraftWrite,
  scheduleNotesWrite,
  subscribeToExternalChanges,
};
