import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './components.d.ts'
import './styles/variables.css'
import './styles/custom.css'

// Custom components
import CustomBadge from './components/Badge.vue'
import Callout from './components/Callout.vue'
import Card from './components/Card.vue'
import CardGrid from './components/CardGrid.vue'
import FeatureGrid from './components/FeatureGrid.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register custom components globally
    app.component('CustomBadge', CustomBadge)
    app.component('Callout', Callout)
    app.component('Card', Card)
    app.component('CardGrid', CardGrid)
    app.component('FeatureGrid', FeatureGrid)
  }
} satisfies Theme