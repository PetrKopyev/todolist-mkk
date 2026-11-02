import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useNotesStore } from "~/stores/notes";
import {
  clearDraft,
  flushWrites,
  readDraft,
  readNotes,
  scheduleDraftWrite,
} from "~/utils/storage";

const STORAGE_KEY = "todolist-mkk:notes";
const DRAFT_KEY = "todolist-mkk:draft";

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
    flushWrites();
    vi.useRealTimers();
  });

  test("сохраняет заметку и отдаёт её после чтения из хранилища", () => {
    const note = store.createNote();
    note.title = "Покупки";
    note.todos = [{ id: "t1", text: "молоко", done: false }];
    store.save(note);

    flushWrites();

    const restored = readNotes();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.title).toBe("Покупки");
    expect(restored[0]?.todos[0]?.text).toBe("молоко");
  });

  test("пишет в хранилище версию схемы", () => {
    store.save(store.createNote());
    flushWrites();

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

  test("отбрасывает заметки с битыми пунктами списка", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        notes: [
          { id: "a", title: "целая", updatedAt: 1, todos: [] },
          { id: "b", title: "сломанная", updatedAt: 1, todos: [42] },
          {
            id: "c",
            title: "без флага выполнения",
            updatedAt: 1,
            todos: [{ id: "t", text: "молоко" }],
          },
        ],
      }),
    );

    const restored = readNotes();

    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).toBe("a");
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

  test("подхватывает изменения из другой вкладки", () => {
    const note = store.save(store.createNote());
    flushWrites();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, notes: [] }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

    expect(store.getById(note.id)).toBeUndefined();
    expect(store.notes).toHaveLength(0);
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

describe("черновик", () => {
  const draft = {
    id: "note-1",
    title: "Покупки",
    todos: [{ id: "t1", text: "молоко", done: false }],
    updatedAt: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    flushWrites();
    vi.useRealTimers();
  });

  test("отдаёт черновик только той заметке, которой он принадлежит", () => {
    scheduleDraftWrite(draft);
    flushWrites();

    expect(readDraft("note-1")?.title).toBe("Покупки");
    expect(readDraft("note-2")).toBeNull();
  });

  test("пишется отложенно и не попадает в список заметок", () => {
    scheduleDraftWrite(draft);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();

    vi.advanceTimersByTime(400);

    expect(readDraft("note-1")).not.toBeNull();
    expect(readNotes()).toEqual([]);
  });

  test("очистка отменяет и запланированную запись", () => {
    scheduleDraftWrite(draft);
    clearDraft();

    vi.advanceTimersByTime(400);

    expect(readDraft("note-1")).toBeNull();
  });
});
