<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
  <input v-model="model" class="input" type="text" />
</template>

<style scoped lang="scss">
.input {
  width: 100%;
  padding: 10px 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--color-brand);
    box-shadow: var(--focus-ring);
  }
}
</style>
