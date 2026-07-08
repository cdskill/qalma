// @qalma/kit/headless — dependency-free behavior for the Qalma editor.
//
// Controllers, geometry helpers, dismiss/keyboard primitives and unstyled
// directives, with zero styling dependencies — no CSS-class or icon libraries.
// Import from here when you bring your own design system and only want the
// editor behavior wired up; import from `@qalma/kit` for the styled components.

// Positioning geometry
export * from './lib/anchor-to-rect';
export * from './lib/flip-above-placement';

// Overlay + list navigation primitives
export * from './lib/dismissible-overlay';
export * from './lib/keyboard-navigable-list';
export * from './lib/suggestion-menu-base';

// Editor-aware controllers + unstyled directives
export * from './lib/drag-handle-controller';
export * from './lib/drag-handle-directive';
export * from './lib/selection-toolbar-controller';
export * from './lib/selection-toolbar-directive';
export * from './lib/link-popover-controller';
export * from './lib/link-popover.model';
