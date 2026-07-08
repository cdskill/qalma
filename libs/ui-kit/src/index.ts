// @qalma/kit — Tailwind/shadcn-flavored UI for the Qalma editor.
//
// This entry point is the styled tier: components that pull `cva` + `@ng-icons`
// and read the host's design tokens. It re-exports the entire dependency-free
// `@qalma/kit/headless` surface (controllers, geometry, keyboard nav) so it
// stays a superset — bring-your-own-design-system consumers can import the
// leaner `@qalma/kit/headless` directly instead.
//
// The internal `QalmaButton` directive and `cn()` helper are intentionally NOT
// exported: a host already has a button and a class-merge utility in its design
// system. They remain private implementation details of the styled components.
export * from '@qalma/kit/headless';

// Toolbar
export * from './lib/toolbar-button';
export * from './lib/toolbar-commands';
export * from './lib/toolbar-registry';
export * from './lib/toolbar-icons';

// Editor surface components
export * from './lib/drag-handle';
export * from './lib/mention-menu';
export * from './lib/slash-command-menu';
export * from './lib/link-popover';
export * from './lib/contextual-toolbar';
