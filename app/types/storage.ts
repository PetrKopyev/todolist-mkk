import type { Note } from "~/types/note";

export interface StoredNotes {
  schemaVersion: number;
  notes: Note[];
}

export interface StoredDraft {
  schemaVersion: number;
  note: Note;
}
