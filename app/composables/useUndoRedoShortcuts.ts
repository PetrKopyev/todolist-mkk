const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA");

export const useUndoRedoShortcuts = (undo: () => void, redo: () => void) => {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.code !== "KeyZ" || !(event.metaKey || event.ctrlKey)) {
      return;
    }

    if (isTextField(event.target)) {
      return;
    }

    event.preventDefault();
    (event.shiftKey ? redo : undo)();
  };

  onMounted(() => window.addEventListener("keydown", onKeydown));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
};
