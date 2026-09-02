import type { Note } from "~/types/note";

const STORAGE_KEY = "todolist-mkk:notes";
const SCHEMA_VERSION = 1;
const WRITE_DELAY = 400;

interface StoredPayload {
  schemaVersion: number;
  notes: Note[];
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingNotes: Note[] | null = null;

const isNote = (value: unknown): value is Note => {
  const note = value as Note;

  return (
    typeof note?.id === "string" &&
    typeof note.title === "string" &&
    typeof note.updatedAt === "number" &&
    Array.isArray(note.todos)
  );
};

const migrate = (payload: unknown) => {
  const { schemaVersion, notes } = (payload ?? {}) as Partial<StoredPayload>;

  if (!Array.isArray(notes) || Number(schemaVersion) > SCHEMA_VERSION) {
    return [];
  }

  return notes.filter(isNote);
};

const readNotes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? migrate(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

const flushWrite = () => {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }

  if (!pendingNotes) {
    return;
  }

  const payload: StoredPayload = {
    schemaVersion: SCHEMA_VERSION,
    notes: pendingNotes,
  };

  pendingNotes = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const scheduleWrite = (notes: Note[]) => {
  pendingNotes = notes;

  if (!writeTimer) {
    writeTimer = setTimeout(flushWrite, WRITE_DELAY);
  }
};

const subscribeToExternalChanges = (onChange: (notes: Note[]) => void) => {
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === STORAGE_KEY) {
      onChange(readNotes());
    }
  });
};

export { flushWrite, readNotes, scheduleWrite, subscribeToExternalChanges };
