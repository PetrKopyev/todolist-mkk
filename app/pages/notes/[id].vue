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

const hasDraft = !!original && !!savedDraft && !sameContent(savedDraft, original);

const dialog = ref<"restore" | "cancel" | "remove" | "deleted" | null>(
  hasDraft ? "restore" : null,
);

const history = reactive(createHistory());

let textBeforeEdit = "";
let isLeaving = false;

const canSave = computed(() => !!draft.value?.title.trim());
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
  record(history, {
    type: "todo-done",
    id: todo.id,
    before: todo.done,
    after: !todo.done,
  });

  todo.done = !todo.done;
};

const addTodo = (afterIndex?: number) => {
  if (!draft.value) {
    return;
  }

  const item: TodoItem = { id: crypto.randomUUID(), text: "", done: false };
  const index =
    afterIndex === undefined
      ? draft.value.todos.length
      : Math.min(afterIndex + 1, draft.value.todos.length);

  draft.value.todos.splice(index, 0, item);
  record(history, { type: "todo-add", index, item: { ...item } });

  nextTick(() => {
    document
      .querySelector<HTMLElement>(`[data-todo-id="${item.id}"] input`)
      ?.focus();
  });
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

  dialog.value = null;
};

const discardDraft = () => {
  clearDraft();
  dialog.value = null;
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

const leave = () => {
  isLeaving = true;
  reset(history);
  clearDraft();
  router.push("/");
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

  leave();
};

const remove = () => {
  store.remove(noteId);
  leave();
};

watch(
  () => !!store.getById(noteId),
  (exists) => {
    if (!exists && !isLeaving) {
      dialog.value = "deleted";
    }
  },
);

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
  <div v-if="draft">
    <PageHeader title="Заметка">
      <BaseButton type="secondary" @click="dialog = 'cancel'">
        Отменить редактирование
      </BaseButton>
      <BaseButton type="danger" @click="dialog = 'remove'">Удалить</BaseButton>
      <BaseButton :disabled="!canSave" @click="save">Сохранить</BaseButton>
    </PageHeader>

    <div class="toolbar">
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

    <ul class="todos">
      <li
        v-for="(todo, index) in draft.todos"
        :key="todo.id"
        :data-todo-id="todo.id"
      >
        <TodoRow
          :todo
          @toggle="toggleTodo(todo)"
          @input="todo.text = $event"
          @enter="addTodo(index)"
          @focus="startTextEdit(todo.text)"
          @blur="finishTodoEdit(todo)"
          @remove="removeTodo(index)"
        />
      </li>
    </ul>

    <BaseButton type="secondary" @click="addTodo()">Добавить пункт</BaseButton>

    <BaseModal
      v-if="dialog === 'deleted'"
      title="Заметка удалена"
      @close="leave"
    >
      Её удалили в другой вкладке, поэтому редактировать больше нечего.

      <template #actions>
        <BaseButton @click="leave">К списку заметок</BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      v-if="dialog === 'restore'"
      title="Восстановить черновик?"
      confirm-label="Восстановить"
      cancel-label="Начать заново"
      @cancel="discardDraft"
      @confirm="restoreDraft"
    >
      У заметки остались несохранённые изменения с прошлого раза.
    </ConfirmDialog>

    <ConfirmDialog
      v-if="dialog === 'cancel'"
      title="Отменить редактирование?"
      confirm-label="Отменить правки"
      @cancel="dialog = null"
      @confirm="leave"
    >
      Внесённые изменения не сохранятся.
    </ConfirmDialog>

    <ConfirmDialog
      v-if="dialog === 'remove'"
      title="Удалить заметку?"
      confirm-label="Удалить"
      danger
      @cancel="dialog = null"
      @confirm="remove"
    >
      «{{ draft.title }}» будет удалена без возможности восстановить.
    </ConfirmDialog>
  </div>

  <div v-else class="missing">
    <h1>Заметка не найдена</h1>
    <p>Возможно, её удалили в другой вкладке.</p>
    <BaseButton @click="router.push('/')">К списку заметок</BaseButton>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.todos {
  display: grid;
  gap: var(--space-sm);
  margin: var(--space-lg) 0;
}

.missing {
  display: grid;
  gap: var(--space-md);
  justify-items: start;
}
</style>
