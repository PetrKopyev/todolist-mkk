<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }>(),
  {
    confirmLabel: "Подтвердить",
    cancelLabel: "Отмена",
  },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <BaseModal :title @close="emit('cancel')">
    <slot />

    <template #actions>
      <BaseButton type="secondary" @click="emit('cancel')">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton :type="danger ? 'danger' : 'primary'" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
