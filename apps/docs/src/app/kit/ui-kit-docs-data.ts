export const UI_KIT_COMPONENT_DOCS = [
  {
    title: 'Toolbar Button',
    href: '/kit/toolbar-button',
    description: 'Icon command button wired to the headless QalmaCommand API.',
  },
  {
    title: 'Toolbar Registry',
    href: '/kit/toolbar-registry',
    description:
      'Declarative command groups with separators and custom template slots.',
  },
  {
    title: 'Mention Menu',
    href: '/kit/mention-menu',
    description: 'Caret-anchored mention suggestions with keyboard movement.',
  },
  {
    title: 'Slash Command Menu',
    href: '/kit/slash-command-menu',
    description: 'Block command palette for slash workflows.',
  },
  {
    title: 'Link Popover',
    href: '/kit/link-popover',
    description: 'Preview/edit surface for link marks.',
  },
  {
    title: 'Contextual Toolbar',
    href: '/kit/contextual-toolbar',
    description: 'Floating inline formatting toolbar for text selections.',
  },
  {
    title: 'Drag Handle',
    href: '/kit/drag-handle',
    description: 'Block handle, action menu, highlight, and drop indicator.',
  },
] as const;

export const UI_KIT_CSS_TOKENS = [
  { name: '--background', description: 'Page and editor surface background.' },
  { name: '--foreground', description: 'Default readable text color.' },
  {
    name: '--card',
    description: 'Buttons, framed previews, and neutral panels.',
  },
  {
    name: '--card-foreground',
    description: 'Text rendered on card surfaces.',
  },
  {
    name: '--popover',
    description: 'Floating menus, toolbars, and popovers.',
  },
  {
    name: '--popover-foreground',
    description: 'Text and icons rendered inside floating surfaces.',
  },
  { name: '--primary', description: 'Primary button background.' },
  {
    name: '--primary-foreground',
    description: 'Text and icons on primary buttons.',
  },
  {
    name: '--secondary',
    description: 'Subtle hover states and neutral fills.',
  },
  {
    name: '--secondary-foreground',
    description: 'Text rendered on secondary surfaces.',
  },
  { name: '--muted', description: 'Quiet backgrounds and code panels.' },
  {
    name: '--muted-foreground',
    description: 'Muted labels, descriptions, and inactive icons.',
  },
  {
    name: '--accent',
    description: 'Active command, focus, and highlight color.',
  },
  {
    name: '--accent-foreground',
    description: 'Text and icons rendered on accent backgrounds.',
  },
  {
    name: '--accent-subtle',
    description: 'Soft active states for selected commands and menu items.',
  },
  {
    name: '--destructive',
    description: 'Danger actions such as unlink/delete.',
  },
  { name: '--border', description: 'Component borders and separators.' },
  { name: '--input', description: 'Input borders inside popovers.' },
  { name: '--ring', description: 'Focus-visible rings.' },
  {
    name: '--radius',
    description: 'Shared radius scale for rounded controls.',
  },
] as const;

export const UI_KIT_OVERRIDE_HOOKS = [
  {
    name: '.qalma-command-active',
    description:
      'Added by QalmaCommand when a toolbar command is active; toolbar buttons style this class.',
  },
  {
    name: 'data-qalma-link-popover',
    description: 'Root element for the link preview/edit popover.',
  },
  {
    name: 'data-qalma-drag-handle',
    description: 'Root element for the floating block drag handle.',
  },
  {
    name: 'data-qalma-dragging-block-highlight',
    description: 'Block highlight displayed during drag sessions.',
  },
  {
    name: 'data-qalma-drag-drop-line',
    description: 'Drop indicator displayed during drag sessions.',
  },
  {
    name: 'data-suggestion-index',
    description:
      'Applied to mention/slash options so keyboard navigation can focus an item by index.',
  },
  {
    name: 'data-suggestion-options',
    description:
      'Optional scroll container used by slash-command menu active-item scrolling.',
  },
] as const;

export const UI_KIT_BEHAVIOR_PRIMITIVES = [
  {
    name: 'anchorToRect',
    description:
      'Fixed-position placement helper for popovers anchored to a DOMRect.',
  },
  {
    name: 'flipAbovePlacement',
    description:
      'Caret menu placement with flip-above behavior and dynamic max-height.',
  },
  {
    name: 'DismissibleOverlay',
    description: 'Pointer-outside plus Escape dismissal for floating menus.',
  },
  {
    name: 'KeyboardNavigableList',
    description:
      'Signal-based ArrowUp/ArrowDown/Enter list navigation primitive.',
  },
] as const;
