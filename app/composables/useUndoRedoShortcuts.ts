const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA");

const isModalOpen = () => document.body.classList.contains("is-modal-open");

export const createShortcutsHandler = (undo: () => void, redo: () => void) => {
  return (event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) {
      return;
    }

    const undoRequested = event.code === "KeyZ" && !event.shiftKey;
    const redoRequested =
      (event.code === "KeyZ" && event.shiftKey) || event.code === "KeyY";

    if (
      (!undoRequested && !redoRequested) ||
      isTextField(event.target) ||
      isModalOpen()
    ) {
      return;
    }

    event.preventDefault();
    (redoRequested ? redo : undo)();
  };
};

export const useUndoRedoShortcuts = (undo: () => void, redo: () => void) => {
  const handler = createShortcutsHandler(undo, redo);

  onMounted(() => window.addEventListener("keydown", handler));
  onBeforeUnmount(() => window.removeEventListener("keydown", handler));
};
