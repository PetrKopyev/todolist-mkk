import { beforeEach, describe, expect, test } from "vitest";
import type { History } from "~/types/history";
import type { Note } from "~/types/note";
import { createHistory, record, redo, reset, undo } from "~/utils/history";

const makeNote = (): Note => ({
  id: "note",
  title: "Покупки",
  todos: [
    { id: "a", text: "молоко", done: false },
    { id: "b", text: "хлеб", done: false },
  ],
  updatedAt: 0,
});

describe("история изменений", () => {
  let history: History;
  let note: Note;

  beforeEach(() => {
    history = createHistory();
    note = makeNote();
  });

  test("отменяет и повторяет правку названия", () => {
    note.title = "Дела";
    record(history, { type: "title", before: "Покупки", after: "Дела" });

    undo(history, note);
    expect(note.title).toBe("Покупки");

    redo(history, note);
    expect(note.title).toBe("Дела");
  });

  test("отменяет и повторяет отметку выполнения", () => {
    note.todos[0]!.done = true;
    record(history, { type: "todo-done", id: "a", before: false, after: true });

    undo(history, note);
    expect(note.todos[0]!.done).toBe(false);

    redo(history, note);
    expect(note.todos[0]!.done).toBe(true);
  });

  test("восстанавливает записанное значение, а не инвертирует текущее", () => {
    record(history, { type: "todo-done", id: "a", before: false, after: true });

    note.todos[0]!.done = false; // внешняя правка вопреки истории
    undo(history, note);

    expect(note.todos[0]!.done).toBe(false);
  });

  test("возвращает удалённый пункт на прежнее место", () => {
    const removed = note.todos[0]!;
    note.todos.splice(0, 1);
    record(history, { type: "todo-remove", index: 0, item: removed });

    undo(history, note);
    expect(note.todos.map((todo) => todo.id)).toEqual(["a", "b"]);

    redo(history, note);
    expect(note.todos.map((todo) => todo.id)).toEqual(["b"]);
  });

  test("отменяет добавление пункта", () => {
    const item = { id: "c", text: "", done: false };
    note.todos.push(item);
    record(history, { type: "todo-add", index: 2, item });

    undo(history, note);
    expect(note.todos).toHaveLength(2);

    redo(history, note);
    expect(note.todos[2]?.id).toBe("c");
  });

  test("новая запись очищает ветку повтора", () => {
    record(history, { type: "title", before: "Покупки", after: "Дела" });
    undo(history, note);
    expect(history.redoStack).toHaveLength(1);

    record(history, { type: "title", before: "Покупки", after: "Планы" });
    expect(history.redoStack).toHaveLength(0);
  });

  test("хранит не больше 50 шагов и выбрасывает самый старый", () => {
    for (let step = 0; step < 55; step += 1) {
      record(history, {
        type: "title",
        before: String(step),
        after: String(step + 1),
      });
    }

    expect(history.undoStack).toHaveLength(50);
    expect(history.undoStack[0]).toMatchObject({ before: "5" });
  });

  test("не падает на пустых стеках", () => {
    undo(history, note);
    redo(history, note);

    expect(note).toEqual(makeNote());
  });

  test("сброс очищает обе ветки", () => {
    record(history, { type: "title", before: "Покупки", after: "Дела" });
    undo(history, note);
    reset(history);

    expect(history.undoStack).toHaveLength(0);
    expect(history.redoStack).toHaveLength(0);
  });

  test("отменяет цепочку изменений в обратном порядке", () => {
    note.title = "Дела";
    record(history, { type: "title", before: "Покупки", after: "Дела" });

    note.todos[1]!.text = "батон";
    record(history, {
      type: "todo-text",
      id: "b",
      before: "хлеб",
      after: "батон",
    });

    undo(history, note);
    expect(note.todos[1]!.text).toBe("хлеб");
    expect(note.title).toBe("Дела");

    undo(history, note);
    expect(note.title).toBe("Покупки");
  });
});
