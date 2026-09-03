import type { Note } from "~/types/note";

export const copyNote = (note: Note): Note => ({
  ...note,
  todos: note.todos.map((todo) => ({ ...todo })),
});
