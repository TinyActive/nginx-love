# nginx-love Documentation Theme

This is a custom VitePress theme for the nginx-love documentation, built on top of the default VitePress theme with enterprise-ready enhancements.

## Features

- Enhanced navigation with dropdown menus
- Custom components for better content presentation
- Enterprise-ready color scheme and design
- Responsive design with mobile optimization
- Dark mode support
- Search functionality
- Custom styling for better readability

## Custom Components

### Badge

Displays a small badge with different types for emphasis.

```vue
<Badge type="success">Success</Badge>
<Badge type="warning">Warning</Badge>
<Badge type="danger">Danger</Badge>
<Badge type="info">Info</Badge>
```

### Callout

Creates a callout box with different types for highlighting important information.

```vue
<Callout type="info" title="Information">
  This is an informational callout.
</Callout>

<Callout type="warning" title="Warning">
  This is a warning callout.
</Callout>

<Callout type="danger" title="Danger">
  This is a danger callout.
</Callout>

<Callout type="tip" title="Tip">
  This is a tip callout.
</Callout>
```

### Card

Creates a styled card container for content.

```vue
<Card title="Card Title">
  This is the card content.
</Card>
```

### CardGrid

Creates a responsive grid layout for cards.

```vue
<CardGrid>
  <Card title="Card 1">Content 1</Card>
  <Card title="Card 2">Content 2</Card>
  <Card title="Card 3">Content 3</Card>
</CardGrid>
```

### FeatureGrid

Creates a responsive grid layout for feature sections.

```vue
<FeatureGrid>
  <Card title="Feature 1">Description 1</Card>
  <Card title="Feature 2">Description 2</Card>
  <Card title="Feature 3">Description 3</Card>
</FeatureGrid>
```

### TeamSection

Displays a team section with member information.

```vue
<TeamSection 
  title="Our Team"
  :members="[
    {
      name: 'John Doe',
      role: 'Developer',
      bio: 'Full-stack developer with expertise in nginx.',
      initials: 'JD',
      social: {
        github: 'https://github.com/johndoe',
        twitter: 'https://twitter.com/johndoe'
      }
    }
  ]"
/>
```

## Custom Styles

The theme includes custom CSS variables and styles defined in:

- `styles/variables.css` - CSS variables for colors, spacing, and typography
- `styles/custom.css` - Custom styles for components and layout

## Configuration

The theme is configured in `.vitepress/config.ts` with:

- Enhanced navigation structure
- Search functionality
- Social links
- Footer configuration
- SEO optimizations
- Sidebar with collapsible sections

## Usage

To use this theme, ensure your VitePress configuration extends the default theme and imports the custom styles and components as shown in `index.ts`.