<script setup lang="ts">
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

defineProps<{ title: string }>();

const emit = defineEmits<{ close: [] }>();

const titleId = useId();
const dialog = useTemplateRef<HTMLElement>("dialog");
let restoreFocusTo: HTMLElement | null = null;

const focusableItems = () => [
  ...(dialog.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
];

const trapTab = (event: KeyboardEvent) => {
  const items = focusableItems();

  if (!items.length) {
    event.preventDefault();
    return;
  }

  const goingBack = event.shiftKey;
  const first = items[0]!;
  const last = items[items.length - 1]!;

  if (document.activeElement === (goingBack ? first : last)) {
    event.preventDefault();
    (goingBack ? last : first).focus();
  }
};

onMounted(async () => {
  restoreFocusTo =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  document.body.classList.add("is-modal-open");

  await nextTick();
  (focusableItems()[0] ?? dialog.value)?.focus();
});

onBeforeUnmount(() => {
  document.body.classList.remove("is-modal-open");
  restoreFocusTo?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      class="modal"
      @keydown.escape="emit('close')"
      @keydown.tab="trapTab"
      @mousedown.self="emit('close')"
    >
      <div
        ref="dialog"
        class="modal__window"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <h2 :id="titleId" class="modal__title">{{ title }}</h2>

        <div class="modal__body">
          <slot />
        </div>

        <div class="modal__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background-color: var(--color-overlay);

  &__window {
    width: 100%;
    max-width: 420px;
    padding: var(--space-lg);
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-modal);

    &:focus {
      outline: none;
    }
  }

  &__title {
    margin-bottom: var(--space-sm);
    font-size: 20px;
  }

  &__body {
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    margin-top: var(--space-lg);

    @include mobile {
      flex-direction: column-reverse;
    }
  }
}
</style>
