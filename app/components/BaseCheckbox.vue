<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="checkbox">
    <input
      v-model="model"
      v-bind="$attrs"
      class="checkbox__control"
      type="checkbox"
    />
    <span class="checkbox__box" aria-hidden="true" />
    <slot />
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;

  &__control {
    @include visually-hidden;
  }

  &__box {
    position: relative;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    transition:
      background-color var(--transition),
      border-color var(--transition);

    &::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 7px;
      width: 5px;
      height: 9px;
      border: solid #ffffff;
      border-width: 0 2px 2px 0;
      opacity: 0;
      transform: rotate(45deg);
    }
  }

  &:hover .checkbox__control:not(:disabled) + .checkbox__box {
    border-color: var(--color-brand);
  }

  &:has(.checkbox__control:disabled) {
    cursor: default;
  }

  &__control:checked + .checkbox__box {
    background-color: var(--color-brand);
    border-color: var(--color-brand);

    &::after {
      opacity: 1;
    }
  }

  &__control:focus-visible + .checkbox__box {
    box-shadow: var(--focus-ring);
  }
}
</style>
