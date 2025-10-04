<template>
  <span :class="['custom-badge', type]">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  type?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

withDefaults(defineProps<Props>(), {
  type: 'default'
})
</script>

<style scoped>
.custom-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--enterprise-radius-sm);
  background-color: var(--enterprise-primary);
  color: white;
  margin-left: 0.5rem;
}

.custom-badge.success {
  background-color: var(--enterprise-success);
}

.custom-badge.warning {
  background-color: var(--enterprise-warning);
  color: #000;
}

.custom-badge.danger {
  background-color: var(--enterprise-danger);
}

.custom-badge.info {
  background-color: var(--enterprise-info);
}
</style>