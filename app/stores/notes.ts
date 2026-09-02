import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Note } from "~/types/note";
import {
  flushWrite,
  readNotes,
  scheduleWrite,
  subscribeToExternalChanges,
} from "~/utils/storage";

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([]);

  const orderedNotes = computed(() =>
    [...notes.value].sort((first, second) => second.updatedAt - first.updatedAt),
  );

  const persist = () => {
    scheduleWrite(notes.value);
  };

  const init = () => {
    notes.value = readNotes();

    subscribeToExternalChanges((external) => {
      notes.value = external;
    });

    window.addEventListener("pagehide", flushWrite);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushWrite();
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
    const stored: Note = {
      ...note,
      todos: note.todos.map((todo) => ({ ...todo })),
      updatedAt: Date.now(),
    };

    const index = notes.value.findIndex((item) => item.id === note.id);

    if (index === -1) {
      notes.value.push(stored);
    } else {
      notes.value[index] = stored;
    }

    persist();

    return stored;
  };

  const remove = (id: string) => {
    notes.value = notes.value.filter((note) => note.id !== id);
    persist();
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
