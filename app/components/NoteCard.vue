<script setup lang="ts">
import type { Note } from "~/types/note";

const VISIBLE_TODOS = 3;

const props = defineProps<{ note: Note }>();

defineEmits<{ edit: []; remove: [] }>();

const visibleTodos = computed(() => props.note.todos.slice(0, VISIBLE_TODOS));
const hiddenCount = computed(
  () => props.note.todos.length - visibleTodos.value.length,
);
</script>

<template>
  <article class="card">
    <div class="card__content">
      <h2 class="card__title">{{ note.title }}</h2>

      <ul v-if="visibleTodos.length" class="card__todos">
        <li v-for="todo in visibleTodos" :key="todo.id">
          <BaseCheckbox :model-value="todo.done" disabled>
            <span :class="{ card__done: todo.done }">{{ todo.text }}</span>
          </BaseCheckbox>
        </li>
      </ul>

      <p v-if="hiddenCount" class="card__more">и ещё {{ hiddenCount }}</p>
    </div>

    <div class="card__actions">
      <BaseButton type="secondary" @click="$emit('edit')">Изменить</BaseButton>
      <BaseButton type="danger" @click="$emit('remove')">Удалить</BaseButton>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);

  @include mobile {
    flex-direction: column;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 18px;
    overflow-wrap: anywhere;
  }

  &__todos {
    display: grid;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }

  &__done {
    color: var(--color-text-muted);
    text-decoration: line-through;
  }

  &__more {
    margin-top: var(--space-sm);
    color: var(--color-text-muted);
    font-size: 14px;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: var(--space-sm);
  }
}
</style>
