<template>
  <div :class="['custom-callout', type]">
    <div class="callout-icon">
      <slot name="icon">
        <span :class="iconClass"></span>
      </slot>
    </div>
    <div class="callout-content">
      <div v-if="title" class="callout-title">{{ title }}</div>
      <div class="callout-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'info' | 'warning' | 'danger' | 'tip'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info'
})

const iconClass = computed(() => {
  const icons = {
    info: 'icon-info',
    warning: 'icon-warning',
    danger: 'icon-danger',
    tip: 'icon-tip'
  }
  return icons[props.type]
})
</script>

<style scoped>
.custom-callout {
  display: flex;
  align-items: flex-start;
  border-radius: var(--enterprise-radius-lg);
  border-left: 4px solid;
  margin: 1rem 0;
  padding: 1rem 1.25rem;
  background-color: var(--vp-c-bg-soft);
}

.custom-callout.info {
  border-color: var(--enterprise-info);
  background-color: rgba(23, 162, 184, 0.1);
}

.custom-callout.warning {
  border-color: var(--enterprise-warning);
  background-color: rgba(255, 193, 7, 0.1);
}

.custom-callout.danger {
  border-color: var(--enterprise-danger);
  background-color: rgba(220, 53, 69, 0.1);
}

.custom-callout.tip {
  border-color: var(--enterprise-success);
  background-color: rgba(40, 167, 69, 0.1);
}

.callout-icon {
  margin-right: 0.75rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.callout-icon span {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}

.icon-info::before {
  content: "ℹ️";
}

.icon-warning::before {
  content: "⚠️";
}

.icon-danger::before {
  content: "🚫";
}

.icon-tip::before {
  content: "💡";
}

.callout-content {
  flex: 1;
}

.callout-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.callout-body {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>