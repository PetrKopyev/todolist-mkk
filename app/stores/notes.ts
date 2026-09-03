import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Note } from "~/types/note";
import { copyNote } from "~/utils/note";
import {
  flushWrites,
  readNotes,
  scheduleNotesWrite,
  subscribeToExternalChanges,
} from "~/utils/storage";

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([]);

  const orderedNotes = computed(() =>
    [...notes.value].sort((first, second) => second.updatedAt - first.updatedAt),
  );

  const init = () => {
    notes.value = readNotes();

    subscribeToExternalChanges((external) => {
      notes.value = external;
    });

    window.addEventListener("pagehide", flushWrites);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushWrites();
      }
    });
  };

  const getById = (id: string) => notes.value.find((note) => note.id === id);

  const createNote = (): Note => ({
    id: crypto.randomUUID(),
    title: "",
    todos: [],
    updatedAt: Date.now(),
  });

  const save = (note: Note) => {
    const stored: Note = { ...copyNote(note), updatedAt: Date.now() };

    const index = notes.value.findIndex((item) => item.id === note.id);

    if (index === -1) {
      notes.value.push(stored);
    } else {
      notes.value[index] = stored;
    }

    scheduleNotesWrite(notes.value);

    return stored;
  };

  const remove = (id: string) => {
    notes.value = notes.value.filter((note) => note.id !== id);
    scheduleNotesWrite(notes.value);
  };

  return {
    notes,
    orderedNotes,
    init,
    getById,
    createNote,
    save,
    remove,
  };
});
