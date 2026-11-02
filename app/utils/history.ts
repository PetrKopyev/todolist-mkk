import type { History, Patch } from "~/types/history";
import type { Note } from "~/types/note";

const LIMIT = 50;

const createHistory = (): History => ({ undoStack: [], redoStack: [] });

const findTodo = (note: Note, id: string) =>
  note.todos.find((todo) => todo.id === id);

const apply = (note: Note, patch: Patch, forward: boolean) => {
  switch (patch.type) {
    case "title": {
      note.title = forward ? patch.after : patch.before;
      break;
    }
    case "todo-text": {
      const todo = findTodo(note, patch.id);

      if (todo) {
        todo.text = forward ? patch.after : patch.before;
      }

      break;
    }
    case "todo-done": {
      const todo = findTodo(note, patch.id);

      if (todo) {
        todo.done = forward ? patch.after : patch.before;
      }

      break;
    }
    case "todo-add": {
      if (forward) {
        note.todos.splice(patch.index, 0, { ...patch.item });
      } else {
        note.todos.splice(patch.index, 1);
      }

      break;
    }
    case "todo-remove": {
      if (forward) {
        note.todos.splice(patch.index, 1);
      } else {
        note.todos.splice(patch.index, 0, { ...patch.item });
      }

      break;
    }
  }
};

const record = (history: History, patch: Patch) => {
  history.undoStack.push(patch);

  if (history.undoStack.length > LIMIT) {
    history.undoStack.shift();
  }

  history.redoStack.length = 0;
};

const undo = (history: History, note: Note) => {
  const patch = history.undoStack.pop();

  if (!patch) {
    return;
  }

  apply(note, patch, false);
  history.redoStack.push(patch);
};

const redo = (history: History, note: Note) => {
  const patch = history.redoStack.pop();

  if (!patch) {
    return;
  }

  apply(note, patch, true);
  history.undoStack.push(patch);
};

const reset = (history: History) => {
  history.undoStack.length = 0;
  history.redoStack.length = 0;
};

export { createHistory, record, redo, reset, undo };
