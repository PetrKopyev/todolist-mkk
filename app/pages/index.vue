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
  <div>
    <PageHeader title="Заметки">
      <BaseButton @click="openCreating">Новая заметка</BaseButton>
    </PageHeader>

    <p v-if="!store.orderedNotes.length" class="empty">Заметок пока нет.</p>

    <ul v-else class="list">
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
  </div>
</template>

<style scoped lang="scss">
.empty {
  color: var(--color-text-muted);
}

.list {
  display: grid;
  gap: var(--space-md);
}
</style>
