<script setup lang="ts">
import type { Note } from "~/types/note";

const store = useNotesStore();
const router = useRouter();

const newTitle = ref("");
const isCreating = ref(false);
const removingNote = ref<Note | null>(null);

const openCreating = () => {
  newTitle.value = "";
  isCreating.value = true;
};

const create = () => {
  const note = store.save({
    ...store.createNote(),
    title: newTitle.value.trim(),
  });

  isCreating.value = false;
  router.push(`/notes/${note.id}`);
};

const remove = () => {
  if (removingNote.value) {
    store.remove(removingNote.value.id);
    removingNote.value = null;
  }
};
</script>

<template>
  <main class="page">
    <header class="page__header">
      <h1>Заметки</h1>
      <BaseButton @click="openCreating">Новая заметка</BaseButton>
    </header>

    <p v-if="!store.orderedNotes.length" class="page__empty">
      Заметок пока нет.
    </p>

    <ul v-else class="page__list">
      <li v-for="note in store.orderedNotes" :key="note.id">
        <NoteCard
          :note
          @edit="router.push(`/notes/${note.id}`)"
          @remove="removingNote = note"
        />
      </li>
    </ul>

    <BaseModal
      v-if="isCreating"
      title="Новая заметка"
      @close="isCreating = false"
    >
      <BaseInput v-model="newTitle" placeholder="Название заметки" />

      <template #actions>
        <BaseButton type="secondary" @click="isCreating = false">
          Отмена
        </BaseButton>
        <BaseButton :disabled="!newTitle.trim()" @click="create">
          Создать
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      v-if="removingNote"
      title="Удалить заметку?"
      confirm-label="Удалить"
      danger
      @cancel="removingNote = null"
      @confirm="remove"
    >
      «{{ removingNote.title }}» будет удалена без возможности восстановить.
    </ConfirmDialog>
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
    margin-bottom: var(--space-xl);

    @include mobile {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__empty {
    color: var(--color-text-muted);
  }

  &__list {
    display: grid;
    gap: var(--space-md);
  }
}
</style>
