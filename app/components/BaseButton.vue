<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "primary" | "secondary" | "danger";
  }>(),
  { type: "primary" },
);
</script>

<template>
  <button class="button" :class="`button--${type}`" type="button">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color var(--transition),
    border-color var(--transition),
    color var(--transition);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background-color: var(--color-brand);
    color: #ffffff;

    &:hover:not(:disabled) {
      background-color: var(--color-brand-dark);
    }
  }

  &--secondary {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover:not(:disabled) {
      border-color: var(--color-brand);
      color: var(--color-brand-dark);
    }
  }

  &--danger {
    background-color: var(--color-danger-soft);
    color: var(--color-danger);

    &:hover:not(:disabled) {
      background-color: var(--color-danger);
      color: #ffffff;
    }
  }
}
</style>
