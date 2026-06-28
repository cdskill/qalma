export interface DocsNavItem {
  readonly title: string;
  readonly href: string;
}

export interface DocsNavGroup {
  readonly title: string;
  readonly items: readonly DocsNavItem[];
}

/**
 * Left-nav structure for the docs site. Each item with an `/docs/...` href
 * is backed by a markdown file at `src/content/docs/<slug>.md` (see
 * `pages/docs/[slug].page.ts`); pages without a file yet fall back to a
 * "coming soon" placeholder rendered from the item's title.
 */
export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs/introduction' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Agent Skills', href: '/docs/agent-skills' },
      { title: 'Quick Start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { title: 'Architecture', href: '/docs/architecture' },
      { title: 'Editor & Controller', href: '/docs/editor-controller' },
      { title: 'Plugins', href: '/docs/plugins' },
      { title: 'Commands', href: '/docs/commands' },
      { title: 'Selection', href: '/docs/selection' },
      { title: 'Content & Serialization', href: '/docs/content' },
      { title: 'Toolbar', href: '/docs/toolbar' },
    ],
  },
  {
    title: 'Formatting',
    items: [
      { title: 'Text Formatting', href: '/docs/text-formatting' },
      { title: 'Inline Code', href: '/docs/inline-code' },
      { title: 'Monospace', href: '/docs/monospace' },
      { title: 'Color & Highlight', href: '/docs/color-highlight' },
      { title: 'Subscript & Superscript', href: '/docs/subscript-superscript' },
      { title: 'Clear Formatting', href: '/docs/clear-formatting' },
    ],
  },
  {
    title: 'Document Structure',
    items: [
      { title: 'Headings', href: '/docs/headings' },
      { title: 'Lists', href: '/docs/lists' },
      { title: 'Task List', href: '/docs/task-list' },
      { title: 'Blockquote', href: '/docs/blockquote' },
      { title: 'Table', href: '/docs/table' },
      { title: 'Horizontal Rule', href: '/docs/horizontal-rule' },
      { title: 'Hard Break & Trailing Paragraph', href: '/docs/hard-break' },
    ],
  },
  {
    title: 'Media & Links',
    items: [
      { title: 'Image', href: '/docs/image' },
      { title: 'Link', href: '/docs/link' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { title: 'Slash Commands', href: '/docs/slash-command' },
      { title: 'Mention', href: '/docs/mention' },
      { title: 'Drag Handle', href: '/docs/drag-handle' },
      { title: 'History (Undo/Redo)', href: '/docs/history' },
      { title: 'Paste Rules', href: '/docs/paste-rules' },
      { title: 'Placeholder', href: '/docs/placeholder' },
      { title: 'Code Block', href: '/docs/code-block' },
    ],
  },
  {
    title: 'Layout',
    items: [{ title: 'Text Align', href: '/docs/text-align' }],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Building a Custom Plugin', href: '/docs/custom-plugin' },
      { title: 'Building a Custom Toolbar', href: '/docs/custom-toolbar' },
      { title: 'Forms Integration', href: '/docs/forms-integration' },
      { title: 'Theming & Styling', href: '/docs/theming' },
      { title: 'Accessibility', href: '/docs/accessibility' },
      { title: 'SSR & Zoneless', href: '/docs/ssr' },
    ],
  },
  {
    title: 'Examples',
    items: [
      { title: 'Live Playground', href: '/#playground' },
      { title: 'Recipes', href: '/docs/recipes' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { title: 'Bundle Size', href: '/docs/bundle-size' },
      { title: 'Changelog', href: '/docs/changelog' },
      { title: 'Roadmap', href: '/docs/roadmap' },
      { title: 'Testing Strategy', href: '/docs/testing-strategy' },
      { title: 'Contributing', href: '/docs/contributing' },
    ],
  },
];

/** Looks up a nav item by its `/docs/<slug>` route slug. */
export function findDocsNavItem(slug: string): DocsNavItem | undefined {
  const href = `/docs/${slug}`;

  for (const group of DOCS_NAV) {
    const item = group.items.find((entry) => entry.href === href);

    if (item) {
      return item;
    }
  }

  return undefined;
}
