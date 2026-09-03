<template>
  <main class="layout">
    <slot />
  </main>
</template>

<style scoped lang="scss">
.layout {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}
</style>
