import { DocsNavGroup } from './docs-nav';

/**
 * Sidebar tree for the `/kit/*` section (the optional `@qalma/kit` component
 * layer). Kept separate from {@link DOCS_NAV} so each section renders its own
 * scoped navigation instead of one long combined list. Every `/kit/...` href
 * is backed by a component page under `pages/kit/` (these are live demos, not
 * markdown content).
 */
export const KIT_NAV: readonly DocsNavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Overview', href: '/kit' },
      { title: 'Theming API', href: '/kit/theming' },
      { title: 'Icons', href: '/kit/icons' },
    ],
  },
  {
    title: 'Components',
    items: [
      { title: 'Toolbar Button', href: '/kit/toolbar-button' },
      { title: 'Toolbar Registry', href: '/kit/toolbar-registry' },
      { title: 'Mention Menu', href: '/kit/mention-menu' },
      { title: 'Slash Command Menu', href: '/kit/slash-command-menu' },
      { title: 'Link Popover', href: '/kit/link-popover' },
      { title: 'Contextual Toolbar', href: '/kit/contextual-toolbar' },
      { title: 'Drag Handle', href: '/kit/drag-handle' },
    ],
  },
  {
    title: 'Primitives',
    items: [{ title: 'Behavior Primitives', href: '/kit/primitives' }],
  },
];
