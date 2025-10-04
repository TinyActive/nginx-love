<template>
  <div class="custom-card">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

defineProps<Props>()
</script>

<style scoped>
.custom-card {
  border: 1px solid var(--vp-c-border);
  border-radius: var(--enterprise-radius-lg);
  padding: 1.5rem;
  background-color: var(--vp-c-bg-elv);
  box-shadow: 0 2px 8px var(--vp-c-shadow-light);
  transition: all 0.3s ease;
}

.custom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--vp-c-shadow);
}

.custom-card h3 {
  margin-top: 0;
  color: var(--enterprise-primary);
}
</style>