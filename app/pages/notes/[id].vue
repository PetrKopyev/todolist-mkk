<script setup lang="ts">
const store = useNotesStore();
const route = useRoute();
const router = useRouter();

const noteId = String(route.params.id);
const original = store.getById(noteId);

const draft = ref(
  original
    ? { ...original, todos: original.todos.map((todo) => ({ ...todo })) }
    : null,
);

const isCancelling = ref(false);
const isRemoving = ref(false);

const canSave = computed(() => Boolean(draft.value?.title.trim()));

const addTodo = () => {
  draft.value?.todos.push({ id: crypto.randomUUID(), text: "", done: false });
};

const removeTodo = (index: number) => {
  draft.value?.todos.splice(index, 1);
};

const save = () => {
  if (!draft.value) {
    return;
  }

  store.save({
    ...draft.value,
    title: draft.value.title.trim(),
    todos: draft.value.todos
      .map((todo) => ({ ...todo, text: todo.text.trim() }))
      .filter((todo) => todo.text),
  });

  router.push("/");
};

const remove = () => {
  store.remove(noteId);
  router.push("/");
};
</script>

<template>
  <main class="page">
    <template v-if="draft">
      <header class="page__header">
        <h1>Заметка</h1>

        <div class="page__actions">
          <BaseButton type="secondary" @click="isCancelling = true">
            Отменить
          </BaseButton>
          <BaseButton type="danger" @click="isRemoving = true">
            Удалить
          </BaseButton>
          <BaseButton :disabled="!canSave" @click="save">Сохранить</BaseButton>
        </div>
      </header>

      <BaseInput v-model="draft.title" placeholder="Название заметки" />

      <ul class="page__todos">
        <li v-for="(todo, index) in draft.todos" :key="todo.id">
          <TodoRow
            v-model:done="todo.done"
            v-model:text="todo.text"
            @remove="removeTodo(index)"
          />
        </li>
      </ul>

      <BaseButton type="secondary" @click="addTodo">Добавить пункт</BaseButton>

      <ConfirmDialog
        v-if="isCancelling"
        title="Отменить редактирование?"
        confirm-label="Отменить правки"
        @cancel="isCancelling = false"
        @confirm="router.push('/')"
      >
        Внесённые изменения не сохранятся.
      </ConfirmDialog>

      <ConfirmDialog
        v-if="isRemoving"
        title="Удалить заметку?"
        confirm-label="Удалить"
        danger
        @cancel="isRemoving = false"
        @confirm="remove"
      >
        «{{ draft.title }}» будет удалена без возможности восстановить.
      </ConfirmDialog>
    </template>

    <div v-else class="page__missing">
      <h1>Заметка не найдена</h1>
      <p>Возможно, её удалили в другой вкладке.</p>
      <BaseButton @click="router.push('/')">К списку заметок</BaseButton>
    </div>
  </main>
</template>

<style scoped lang="scss">
.page {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);

    @include mobile {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space-sm);
  }

  &__todos {
    display: grid;
    gap: var(--space-sm);
    margin: var(--space-lg) 0;
  }

  &__missing {
    display: grid;
    gap: var(--space-md);
    justify-items: start;
  }
}
</style>
