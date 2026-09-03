<script setup lang="ts">
import type { TodoItem } from "~/types/note";

defineProps<{ todo: TodoItem }>();

const emit = defineEmits<{
  toggle: [];
  input: [value: string];
  focus: [];
  blur: [];
  remove: [];
}>();
</script>

<template>
  <div class="todo">
    <BaseCheckbox
      :model-value="todo.done"
      aria-label="Выполнено"
      @update:model-value="emit('toggle')"
    />
    <BaseInput
      :model-value="todo.text"
      placeholder="Что нужно сделать"
      @update:model-value="emit('input', $event)"
      @focus="emit('focus')"
      @blur="emit('blur')"
    />
    <BaseButton
      type="danger"
      aria-label="Удалить пункт"
      @click="emit('remove')"
    >
      ×
    </BaseButton>
  </div>
</template>

<style scoped lang="scss">
.todo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
</style>
