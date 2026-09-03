<script setup lang="ts">
const done = defineModel<boolean>("done", { required: true });
const text = defineModel<string>("text", { required: true });

defineEmits<{ remove: [] }>();
</script>

<template>
  <div class="todo">
    <BaseCheckbox v-model="done" aria-label="Выполнено" />
    <BaseInput v-model="text" placeholder="Что нужно сделать" />
    <BaseButton type="danger" aria-label="Удалить пункт" @click="$emit('remove')">
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
