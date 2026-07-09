/**
 * Package-manager commands for the UI Kit install picker.
 */
export const UI_KIT_INSTALL_COMMANDS = [
  {
    id: 'pnpm',
    command:
      'pnpm add @qalma/editor @qalma/kit @ng-icons/core @ng-icons/lucide',
  },
  {
    id: 'npm',
    command:
      'npm install @qalma/editor @qalma/kit @ng-icons/core @ng-icons/lucide',
  },
  {
    id: 'yarn',
    command:
      'yarn add @qalma/editor @qalma/kit @ng-icons/core @ng-icons/lucide',
  },
  {
    id: 'bun',
    command: 'bun add @qalma/editor @qalma/kit @ng-icons/core @ng-icons/lucide',
  },
] as const;

/**
 * Static snippets still shown as plain code panels (no live preview to drift
 * from): theme token recipes on the theming page. Every component page now
 * renders a real `*.demo.ts` and shows that same file's source via `?raw`, so
 * those snippets live with their demos instead of here.
 */
export const UI_KIT_SNIPPETS = {
  tailwindSource: `@import 'tailwindcss';

/* Adjust the path if your global stylesheet is not src/styles.css. */
@source '../node_modules/@qalma/kit';`,
  theme: `:root {
  --radius: 0.625rem;
  --background: #ffffff;
  --foreground: #18181b;
  --card: #ffffff;
  --card-foreground: #18181b;
  --popover: #ffffff;
  --popover-foreground: #18181b;
  --primary: #18181b;
  --primary-foreground: #fafafa;
  --secondary: #f4f4f5;
  --secondary-foreground: #27272a;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --accent: #2563eb;
  --accent-foreground: #ffffff;
  --accent-subtle: #dbeafe;
  --destructive: #dc2626;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --ring: #2563eb;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-subtle: var(--accent-subtle);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`,
} as const;
