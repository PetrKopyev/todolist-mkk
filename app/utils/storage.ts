import type { Note } from "~/types/note";
import type { StoredDraft, StoredNotes } from "~/types/storage";

const NOTES_KEY = "todolist-mkk:notes";
const DRAFT_KEY = "todolist-mkk:draft";
const SCHEMA_VERSION = 1;
const WRITE_DELAY = 400;

const isNote = (value: unknown): value is Note => {
  const note = value as Note;

  return (
    typeof note?.id === "string" &&
    typeof note.title === "string" &&
    typeof note.updatedAt === "number" &&
    Array.isArray(note.todos)
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

const readNotes = () => {
  const { schemaVersion, notes } = (readJson(NOTES_KEY) ??
    {}) as Partial<StoredNotes>;

  if (!Array.isArray(notes) || Number(schemaVersion) > SCHEMA_VERSION) {
    return [];
  }

  return notes.filter(isNote);
};

const readDraft = (noteId: string) => {
  const { schemaVersion, note } = (readJson(DRAFT_KEY) ??
    {}) as Partial<StoredDraft>;

  if (Number(schemaVersion) > SCHEMA_VERSION || !isNote(note)) {
    return null;
  }

  return note.id === noteId ? note : null;
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
