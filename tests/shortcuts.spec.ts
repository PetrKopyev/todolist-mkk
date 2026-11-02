import { afterEach, describe, expect, test, vi } from "vitest";
import { createShortcutsHandler } from "~/composables/useUndoRedoShortcuts";

describe("горячие клавиши отмены и повтора", () => {
  const undo = vi.fn();
  const redo = vi.fn();
  const handler = createShortcutsHandler(undo, redo);

  const fire = (init: KeyboardEventInit): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { cancelable: true, ...init });

    handler(event);

    return event;
  };

  afterEach(() => {
    document.body.classList.remove("is-modal-open");
    undo.mockClear();
    redo.mockClear();
  });

  test("Ctrl+Z вне текстовых полей отменяет действие", () => {
    const event = fire({ code: "KeyZ", ctrlKey: true });

    expect(undo).toHaveBeenCalledOnce();
    expect(redo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  test("Cmd+Z на macOS отменяет действие", () => {
    fire({ code: "KeyZ", metaKey: true });

    expect(undo).toHaveBeenCalledOnce();
  });

  test("работает в русской раскладке, где клавиша определяется по коду", () => {
    fire({ code: "KeyZ", key: "я", ctrlKey: true });

    expect(undo).toHaveBeenCalledOnce();
  });

  test("Shift+Ctrl+Z повторяет действие", () => {
    const event = fire({ code: "KeyZ", ctrlKey: true, shiftKey: true });

    expect(redo).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  test("Ctrl+Y повторяет действие по виндовой конвенции", () => {
    fire({ code: "KeyY", ctrlKey: true });

    expect(redo).toHaveBeenCalledOnce();
  });

  test("внутри текстовых полей не перехватывает нативную отмену", () => {
    const input = document.createElement("input");
    document.body.append(input);

    const event = new KeyboardEvent("keydown", {
      cancelable: true,
      code: "KeyZ",
      ctrlKey: true,
    });

    input.dispatchEvent(event);
    handler(event);
    input.remove();

    expect(undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test("не срабатывает, пока открыта модалка", () => {
    document.body.classList.add("is-modal-open");

    const event = fire({ code: "KeyZ", ctrlKey: true });

    expect(undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test("игнорирует комбинации с Alt", () => {
    fire({ code: "KeyZ", ctrlKey: true, altKey: true });

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  test("игнорирует нажатия без модификаторов", () => {
    fire({ code: "KeyZ" });

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });
});
