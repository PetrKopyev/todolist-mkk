import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useNotesStore } from "~/stores/notes";
import { flushWrite, readNotes } from "~/utils/storage";

const STORAGE_KEY = "todolist-mkk:notes";

describe("стор заметок", () => {
  let store: ReturnType<typeof useNotesStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();

    store = useNotesStore();
    store.init();
  });

  afterEach(() => {
    flushWrite();
    vi.useRealTimers();
  });

  test("сохраняет заметку и отдаёт её после чтения из хранилища", () => {
    const note = store.createNote();
    note.title = "Покупки";
    note.todos = [{ id: "t1", text: "молоко", done: false }];
    store.save(note);

    flushWrite();

    const restored = readNotes();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.title).toBe("Покупки");
    expect(restored[0]?.todos[0]?.text).toBe("молоко");
  });

  test("пишет в хранилище версию схемы", () => {
    store.save(store.createNote());
    flushWrite();

    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw).toMatchObject({ schemaVersion: 1 });
  });

  test("откладывает запись, а не пишет на каждое изменение", () => {
    store.save(store.createNote());
    store.save(store.createNote());
    store.save(store.createNote());

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    vi.advanceTimersByTime(400);

    expect(readNotes()).toHaveLength(3);
  });

  test("отбрасывает битые данные и данные более новой схемы", () => {
    localStorage.setItem(STORAGE_KEY, "не json");
    expect(readNotes()).toEqual([]);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 99, notes: [{ id: "a" }] }),
    );
    expect(readNotes()).toEqual([]);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, notes: [{ id: "a" }, null, 5] }),
    );
    expect(readNotes()).toEqual([]);
  });

  test("показывает недавно изменённые заметки первыми", () => {
    const first = store.save(store.createNote());
    vi.advanceTimersByTime(1000);
    const second = store.save(store.createNote());

    expect(store.orderedNotes[0]?.id).toBe(second.id);

    vi.advanceTimersByTime(1000);
    store.save(first);

    expect(store.orderedNotes[0]?.id).toBe(first.id);
  });

  test("удаляет заметку", () => {
    const note = store.save(store.createNote());
    store.remove(note.id);

    expect(store.notes).toHaveLength(0);
    expect(store.getById(note.id)).toBeUndefined();
  });

  test("не связывает сохранённую заметку с переданным объектом", () => {
    const todo = { id: "t1", text: "молоко", done: false };
    const note = store.createNote();
    note.todos = [todo];
    store.save(note);

    note.title = "изменено снаружи";
    todo.text = "хлеб";

    expect(store.getById(note.id)?.title).toBe("");
    expect(store.getById(note.id)?.todos[0]?.text).toBe("молоко");
  });
});
