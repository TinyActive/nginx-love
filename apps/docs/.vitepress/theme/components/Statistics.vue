<template>
  <div class="statistics">
    <div class="container">
      <div class="stats-grid">
        <div 
          v-for="(stat, index) in stats" 
          :key="index"
          class="stat-card"
          data-animate="fade-up"
          :data-delay="index * 100"
        >
          <div class="stat-icon" v-html="stat.icon"></div>
          <div class="stat-content">
            <div class="stat-value">
              <a 
                v-if="stat.link" 
                :href="stat.link" 
                target="_blank" 
                rel="noopener noreferrer"
                class="stat-link"
              >
                {{ stat.value }}
              </a>
              <span v-else>{{ stat.value }}</span>
            </div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Stat {
  icon: string
  value: string
  label: string
  link?: string
}

const stats = ref<Stat[]>([
  {
    icon: '<svg viewBox="0 0 48 48" fill="none"><path d="M24 2l7.5 15.2L48 19.8l-12 11.7L38.8 48 24 40.2 9.2 48l2.8-16.5L0 19.8l16.5-2.6L24 2z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    value: '...',
    label: 'GitHub Stars',
    link: 'https://github.com/TinyActive/nginx-love'
  },
  {
    icon: '<svg viewBox="0 0 48 48" fill="none"><path d="M24 4v20M24 24l-8-8M24 24l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 32v8a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4v-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    value: '...',
    label: 'GitHub Forks',
    link: 'https://github.com/TinyActive/nginx-love/fork'
  },
  {
    icon: '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 24h16M16 28h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    value: '500+',
    label: 'Active Installations'
  }
])

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K+'
  }
  return num.toString()
}

const fetchGitHubStats = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/TinyActive/nginx-love')
    if (response.ok) {
      const data = await response.json()
      
      // Update stars
      stats.value[0].value = formatNumber(data.stargazers_count)
      
      // Update forks
      stats.value[1].value = formatNumber(data.forks_count)
    }
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error)
    // Keep default values if fetch fails
    stats.value[0].value = '0'
    stats.value[1].value = '0'
  }
}

onMounted(() => {
  fetchGitHubStats()
})
</script>

<style scoped>
.statistics {
  padding: 80px 0;
  background: linear-gradient(135deg,
    hsl(var(--vp-c-brand-soft)) 0%,
    hsl(var(--vp-c-bg-soft)) 100%
  );
  border-top: 1px solid hsl(var(--vp-c-border));
  border-bottom: 1px solid hsl(var(--vp-c-border));
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  background: hsl(var(--vp-c-bg));
  border: 1px solid hsl(var(--vp-c-border));
  border-radius: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: hsl(var(--vp-c-brand-1));
}

.stat-icon {
  width: 48px;
  height: 48px;
  color: hsl(var(--vp-c-brand-1));
  flex-shrink: 0;
}

.stat-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(120deg,
    hsl(var(--vp-c-brand-1)) 0%,
    hsl(var(--vp-c-brand-2)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--vp-c-text-2));
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 32px;
  }
}
</style>
