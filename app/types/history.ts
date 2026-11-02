import type { TodoItem } from "~/types/note";

export type Patch =
  | { type: "title"; before: string; after: string }
  | { type: "todo-text"; id: string; before: string; after: string }
  | { type: "todo-done"; id: string; before: boolean; after: boolean }
  | { type: "todo-add"; index: number; item: TodoItem }
  | { type: "todo-remove"; index: number; item: TodoItem };

export interface History {
  undoStack: Patch[];
  redoStack: Patch[];
}
