import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'nginx-love Documentation',
  description: 'Enterprise Nginx + ModSecurity Management Platform',
  lang: 'en-US',
  
  // Theme appearance
  appearance: 'dark',
  
  // SEO Configuration
  head: [
    ['meta', { name: 'keywords', content: 'nginx, modsecurity, enterprise, security, web server, management platform' }],
    ['meta', { name: 'author', content: 'nginx-love team' }],
    ['meta', { property: 'og:title', content: 'nginx-love Documentation' }],
    ['meta', { property: 'og:description', content: 'Enterprise Nginx + ModSecurity Management Platform' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'nginx-love Documentation' }],
    ['meta', { name: 'twitter:description', content: 'Enterprise Nginx + ModSecurity Management Platform' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    // Enhanced navigation with dropdown menus
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Documentation',
        items: [
          { text: 'Getting Started', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick Start', link: '/guide/quick-start' }
        ]
      },
      {
        text: 'Features',
        items: [
          { text: 'Domain Management', link: '/guide/domains' },
          { text: 'SSL Management', link: '/guide/ssl' },
          { text: 'ModSecurity', link: '/guide/modsecurity' },
          { text: 'Performance', link: '/guide/performance' },
          { text: 'Log Analysis', link: '/guide/logs' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Authentication', link: '/api/auth' },
          { text: 'Domains', link: '/api/domains' },
          { text: 'SSL', link: '/api/ssl' },
          { text: 'ModSecurity', link: '/api/modsecurity' },
          { text: 'Performance', link: '/api/performance' },
          { text: 'Logs', link: '/api/logs' },
          { text: 'Users', link: '/api/users' }
        ]
      },
      {
        text: 'Resources',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Troubleshooting', link: '/reference/troubleshooting' },
          { text: 'FAQ', link: '/reference/faq' }
        ]
      }
    ],

    // Enhanced sidebar with collapsible sections
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Features',
          collapsed: false,
          items: [
            { text: 'Domain Management', link: '/guide/domains' },
            { text: 'SSL Management', link: '/guide/ssl' },
            { text: 'ModSecurity', link: '/guide/modsecurity' },
            { text: 'Performance Monitoring', link: '/guide/performance' },
            { text: 'Log Analysis', link: '/guide/logs' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'Authentication',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/api/auth' }
          ]
        },
        {
          text: 'Domain Management',
          collapsed: false,
          items: [
            { text: 'API Reference', link: '/api/domains' }
          ]
        },
        {
          text: 'SSL Management',
          collapsed: false,
          items: [
            { text: 'API Reference', link: '/api/ssl' }
          ]
        },
        {
          text: 'Security',
          collapsed: false,
          items: [
            { text: 'ModSecurity', link: '/api/modsecurity' }
          ]
        },
        {
          text: 'Monitoring',
          collapsed: false,
          items: [
            { text: 'Performance', link: '/api/performance' },
            { text: 'Logs', link: '/api/logs' }
          ]
        },
        {
          text: 'User Management',
          collapsed: false,
          items: [
            { text: 'API Reference', link: '/api/users' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          collapsed: false,
          items: [
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Troubleshooting', link: '/reference/troubleshooting' },
            { text: 'FAQ', link: '/reference/faq' }
          ]
        }
      ]
    },

    // Search configuration
    search: {
      provider: 'local',
    },

    // Edit link configuration
    editLink: {
      pattern: 'https://github.com/nginx-love/nginx-love/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Enhanced social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TinyActive/nginx-love' },
    ],

    // Enhanced footer
    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: `Copyright © 2025-${new Date().getFullYear()} nginx-love`
    },

    // Custom theme colors
    // Note: appearance is now set at the root level

    // Additional configurations
    outline: {
      label: 'Page navigation',
      level: [2, 3]
    },

    // Table of contents
    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    // Return to top button
    returnToTopLabel: 'Back to top',

    // External link indicator
    externalLinkIcon: true,

    // Last updated text
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  // Markdown configuration
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
    config: (md) => {
      // Add any markdown-it plugins here
    }
  },

  // Vite configuration
  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    },
    server: {
      host: true,
      port: 5173
    },
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 1000
    }
  }
})