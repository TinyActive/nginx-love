<template>
  <div class="home-hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge" data-animate="fade-up">
          <span class="badge-icon">🚀</span>
          <span class="badge-text">Enterprise-Grade WAF Platform</span>
        </div>
        
        <h1 class="hero-title" data-animate="fade-up" data-delay="100">
          <span class="gradient-text">Nginx + ModSecurity</span>
          <br />
          Management Platform
        </h1>
        
        <p class="hero-description" data-animate="fade-up" data-delay="200">
          A comprehensive, modern platform for managing Nginx configurations, SSL certificates, 
          and ModSecurity WAF rules with real-time monitoring and analytics.
        </p>
        
        <div class="hero-actions" data-animate="fade-up" data-delay="300">
          <a href="/guide/installation" class="btn btn-primary">
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <a href="https://github.com/TinyActive/nginx-love" class="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>
        
        <div class="hero-stats" data-animate="fade-up" data-delay="400">
          <div class="stat-item">
            <div class="stat-value">{{ githubStats.stars }}</div>
            <div class="stat-label">GitHub Stars</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">{{ githubStats.forks }}</div>
            <div class="stat-label">GitHub Forks</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">{{ githubStats.installations }}</div>
            <div class="stat-label">Active Installations</div>
          </div>
        </div>
      </div>
      
      <div class="hero-visual" data-animate="fade-left" data-delay="200">
        <div class="visual-container">
          <div class="visual-card card-1">
            <div class="card-header">
              <div class="status-dot status-success"></div>
              <span>System Status</span>
            </div>
            <div class="card-content">
              <div class="metric">
                <span class="metric-label">Requests/s</span>
                <span class="metric-value">1,247</span>
              </div>
              <div class="metric-chart">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <polyline points="0,30 10,25 20,28 30,20 40,22 50,15 60,18 70,10 80,12 90,8 100,5" 
                    fill="none" stroke="url(#gradient1)" stroke-width="2"/>
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
                      <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="visual-card card-2">
            <div class="card-header">
              <div class="status-dot status-warning"></div>
              <span>WAF Protection</span>
            </div>
            <div class="card-content">
              <div class="protection-item">
                <span>🛡️ Blocked Threats</span>
                <span class="protection-value">342</span>
              </div>
              <div class="protection-item">
                <span>🔒 Active Rules</span>
                <span class="protection-value">1,250</span>
              </div>
            </div>
          </div>
          
          <div class="visual-card card-3">
            <div class="card-header">
              <div class="status-dot status-info"></div>
              <span>SSL Certificates</span>
            </div>
            <div class="card-content">
              <div class="ssl-item">
                <div class="ssl-icon">🔐</div>
                <div class="ssl-info">
                  <span class="ssl-domain">example.com</span>
                  <span class="ssl-expiry">Expires in 89 days</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Floating elements for decoration -->
          <div class="float-element float-1">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="url(#gradient2)" stroke-width="2" opacity="0.5"/>
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="float-element float-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="url(#gradient3)" opacity="0.3"/>
              <defs>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(236,72,153);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(239,68,68);stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Background decorations -->
    <div class="bg-decoration bg-decoration-1"></div>
    <div class="bg-decoration bg-decoration-2"></div>
    <div class="bg-grid"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// GitHub stats state
const githubStats = ref({
  stars: '...',
  forks: '...',
  installations: '500+'
})

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
      githubStats.value.stars = formatNumber(data.stargazers_count)
      githubStats.value.forks = formatNumber(data.forks_count)
    }
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error)
    githubStats.value.stars = '0'
    githubStats.value.forks = '0'
  }
}

onMounted(() => {
  // Fetch GitHub stats
  fetchGitHubStats()

  // Intersection Observer for animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated')
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el)
  })
})
</script>

<style scoped>
.home-hero {
  position: relative;
  padding: 120px 0 80px;
  overflow: hidden;
  background: linear-gradient(to bottom, 
    hsl(var(--vp-c-bg)) 0%, 
    hsl(var(--vp-c-bg-soft)) 100%
  );
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: hsl(var(--vp-c-bg-soft));
  border: 1px solid hsl(var(--vp-c-border));
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.badge-icon {
  font-size: 16px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 24px 0;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(120deg, 
    hsl(var(--vp-c-brand-1)) 0%,
    hsl(var(--vp-c-brand-2)) 50%,
    hsl(var(--vp-c-brand-3)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 20px;
  line-height: 1.6;
  color: hsl(var(--vp-c-text-2));
  margin: 0 0 32px 0;
  max-width: 540px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, 
    hsl(var(--vp-c-brand-1)) 0%,
    hsl(var(--vp-c-brand-2)) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: hsl(var(--vp-c-bg-soft));
  color: hsl(var(--vp-c-text-1));
  border: 1px solid hsl(var(--vp-c-border));
}

.btn-secondary:hover {
  background: hsl(var(--vp-c-bg-mute));
  border-color: hsl(var(--vp-c-brand-1));
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: hsl(var(--vp-c-brand-1));
}

.stat-label {
  font-size: 14px;
  color: hsl(var(--vp-c-text-2));
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: hsl(var(--vp-c-border));
}

.hero-visual {
  position: relative;
  z-index: 2;
}

.visual-container {
  position: relative;
  height: 600px;
}

.visual-card {
  position: absolute;
  background: hsl(var(--vp-c-bg));
  border: 1px solid hsl(var(--vp-c-border));
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
}

.card-1 {
  top: 0;
  left: 0;
  width: 280px;
  animation: float 6s ease-in-out infinite;
}

.card-2 {
  top: 180px;
  right: 40px;
  width: 260px;
  animation: float 7s ease-in-out infinite 1s;
}

.card-3 {
  bottom: 40px;
  left: 60px;
  width: 300px;
  animation: float 8s ease-in-out infinite 2s;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--vp-c-text-1));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-success {
  background: #22c55e;
}

.status-warning {
  background: #f59e0b;
}

.status-info {
  background: #3b82f6;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 13px;
  color: hsl(var(--vp-c-text-2));
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: hsl(var(--vp-c-brand-1));
}

.metric-chart {
  height: 60px;
  margin-top: 12px;
}

.metric-chart svg {
  width: 100%;
  height: 100%;
}

.protection-item,
.ssl-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
}

.protection-value {
  font-weight: 700;
  color: hsl(var(--vp-c-brand-1));
}

.ssl-item {
  gap: 12px;
}

.ssl-icon {
  font-size: 24px;
}

.ssl-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.ssl-domain {
  font-weight: 600;
  color: hsl(var(--vp-c-text-1));
}

.ssl-expiry {
  font-size: 12px;
  color: hsl(var(--vp-c-text-2));
}

.float-element {
  position: absolute;
  animation: float 10s ease-in-out infinite;
}

.float-1 {
  top: 100px;
  right: -30px;
  animation-delay: 0s;
}

.float-2 {
  bottom: 100px;
  left: -20px;
  animation-delay: 3s;
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  pointer-events: none;
}

.bg-decoration-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  top: -200px;
  left: -100px;
}

.bg-decoration-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #ec4899, #ef4444);
  bottom: -150px;
  right: -100px;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(hsl(var(--vp-c-border)) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--vp-c-border)) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.05;
  pointer-events: none;
}

/* Animations */
[data-animate] {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-animate].animated {
  opacity: 1;
  transform: translateY(0);
}

[data-animate="fade-left"] {
  transform: translateX(50px);
}

[data-animate="fade-left"].animated {
  transform: translateX(0);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive */
@media (max-width: 960px) {
  .container {
    grid-template-columns: 1fr;
    gap: 60px;
  }
  
  .hero-visual {
    height: 400px;
  }
  
  .visual-container {
    height: 400px;
  }
  
  .card-1, .card-2, .card-3 {
    width: 220px;
  }
  
  .hero-title {
    font-size: 42px;
  }
}

@media (max-width: 640px) {
  .home-hero {
    padding: 80px 0 60px;
  }
  
  .hero-title {
    font-size: 36px;
  }
  
  .hero-description {
    font-size: 18px;
  }
  
  .hero-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .hero-stats {
    flex-wrap: wrap;
  }
  
  .visual-container {
    height: 300px;
  }
}
</style>
