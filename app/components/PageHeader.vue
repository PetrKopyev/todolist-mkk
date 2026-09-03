<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <header class="header">
    <h1>{{ title }}</h1>

    <div class="header__actions">
      <slot />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);

  @include mobile {
    flex-direction: column;
    align-items: stretch;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
}
</style>
