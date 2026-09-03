<script setup lang="ts">
import type { Note, TodoItem } from "~/types/note";
import { createHistory, record, redo, reset, undo } from "~/utils/history";
import { copyNote } from "~/utils/note";
import { clearDraft, readDraft, scheduleDraftWrite } from "~/utils/storage";

const store = useNotesStore();
const route = useRoute();
const router = useRouter();

const noteId = String(route.params.id);
const original = store.getById(noteId);

const sameContent = (first: Note, second: Note) =>
  first.title === second.title &&
  JSON.stringify(first.todos) === JSON.stringify(second.todos);

const draft = ref(original ? copyNote(original) : null);
const savedDraft = original ? readDraft(noteId) : null;

const isRestoring = ref(
  Boolean(original && savedDraft && !sameContent(savedDraft, original)),
);

const history = reactive(createHistory());
const isCancelling = ref(false);
const isRemoving = ref(false);

let textBeforeEdit = "";

const canSave = computed(() => Boolean(draft.value?.title.trim()));
const canUndo = computed(() => history.undoStack.length > 0);
const canRedo = computed(() => history.redoStack.length > 0);

const startTextEdit = (value: string) => {
  textBeforeEdit = value;
};

const finishTitleEdit = () => {
  const after = draft.value?.title ?? "";

  if (after !== textBeforeEdit) {
    record(history, { type: "title", before: textBeforeEdit, after });
  }
};

const finishTodoEdit = (todo: TodoItem) => {
  if (todo.text !== textBeforeEdit) {
    record(history, {
      type: "todo-text",
      id: todo.id,
      before: textBeforeEdit,
      after: todo.text,
    });
  }
};

const toggleTodo = (todo: TodoItem) => {
  todo.done = !todo.done;
  record(history, { type: "todo-done", id: todo.id });
};

const addTodo = () => {
  if (!draft.value) {
    return;
  }

  const item: TodoItem = { id: crypto.randomUUID(), text: "", done: false };
  const index = draft.value.todos.length;

  draft.value.todos.push(item);
  record(history, { type: "todo-add", index, item: { ...item } });
};

const removeTodo = (index: number) => {
  const item = draft.value?.todos[index];

  if (!draft.value || !item) {
    return;
  }

  draft.value.todos.splice(index, 1);
  record(history, { type: "todo-remove", index, item });
};

const restoreDraft = () => {
  if (savedDraft) {
    draft.value = copyNote(savedDraft);
  }

  isRestoring.value = false;
};

const discardDraft = () => {
  clearDraft();
  isRestoring.value = false;
};

const undoChange = () => {
  if (draft.value) {
    undo(history, draft.value);
  }
};

const redoChange = () => {
  if (draft.value) {
    redo(history, draft.value);
  }
};

useUndoRedoShortcuts(undoChange, redoChange);

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

  reset(history);
  clearDraft();
  router.push("/");
};

const cancel = () => {
  reset(history);
  clearDraft();
  router.push("/");
};

const remove = () => {
  store.remove(noteId);
  clearDraft();
  router.push("/");
};

watch(
  draft,
  (value) => {
    if (value) {
      scheduleDraftWrite(value);
    }
  },
  { deep: true },
);
</script>

<template>
  <main class="page">
    <template v-if="draft">
      <header class="page__header">
        <h1>Заметка</h1>

        <div class="page__actions">
          <BaseButton type="secondary" @click="isCancelling = true">
            Отменить редактирование
          </BaseButton>
          <BaseButton type="danger" @click="isRemoving = true">
            Удалить
          </BaseButton>
          <BaseButton :disabled="!canSave" @click="save">Сохранить</BaseButton>
        </div>
      </header>

      <div class="page__toolbar">
        <BaseButton type="secondary" :disabled="!canUndo" @click="undoChange">
          Отменить действие
        </BaseButton>
        <BaseButton type="secondary" :disabled="!canRedo" @click="redoChange">
          Повторить действие
        </BaseButton>
      </div>

      <BaseInput
        v-model="draft.title"
        placeholder="Название заметки"
        @focus="startTextEdit(draft.title)"
        @blur="finishTitleEdit"
      />

      <ul class="page__todos">
        <li v-for="(todo, index) in draft.todos" :key="todo.id">
          <TodoRow
            :todo
            @toggle="toggleTodo(todo)"
            @input="todo.text = $event"
            @focus="startTextEdit(todo.text)"
            @blur="finishTodoEdit(todo)"
            @remove="removeTodo(index)"
          />
        </li>
      </ul>

      <BaseButton type="secondary" @click="addTodo">Добавить пункт</BaseButton>

      <ConfirmDialog
        v-if="isRestoring"
        title="Восстановить черновик?"
        confirm-label="Восстановить"
        cancel-label="Начать заново"
        @cancel="discardDraft"
        @confirm="restoreDraft"
      >
        У заметки остались несохранённые изменения с прошлого раза.
      </ConfirmDialog>

      <ConfirmDialog
        v-if="isCancelling"
        title="Отменить редактирование?"
        confirm-label="Отменить правки"
        @cancel="isCancelling = false"
        @confirm="cancel"
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

  &__actions,
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  &__toolbar {
    margin-bottom: var(--space-md);
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
