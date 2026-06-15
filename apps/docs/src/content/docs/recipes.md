---
title: Recipes
description: Copy focused Qalma integration recipes for common editor features.
---

# Recipes

These recipes use only the public `@qalma/editor` API. They are small on
purpose; compose them into your own Angular components and design system.

## Minimal editor

```typescript
const editor = createQalmaEditor({
  content: '<p>Hello world</p>',
  plugins: [...TextFormattingKit, HistoryPlugin],
});
```

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar>
    <button type="button" qalmaCommand="toggleBold">Bold</button>
    <button type="button" qalmaCommand="undo">Undo</button>
    <button type="button" qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Insert an image from a file input

```typescript
insertImage(event: Event): void {
  const input = event.target;

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const file = input.files?.item(0);

  if (!file || !file.type.startsWith('image/')) {
    return;
  }

  this.editor.execute('insertImage', {
    src: `/uploads/${encodeURIComponent(file.name)}`,
    alt: file.name.replace(/\.[^.]+$/, ''),
    title: file.name,
    previewSrc: URL.createObjectURL(file),
  });
}
```

## Link toolbar button with a custom popover

```typescript
readonly href = signal('https://');

openLinkEditor(): void {
  const link = this.editor.query<LinkState>('link');
  this.href.set(link?.href ?? 'https://');
}

saveLink(): void {
  this.editor.execute('setLink', this.href());
}

removeLink(): void {
  this.editor.execute('unsetLink');
}
```

## Color swatches

```typescript
readonly colors = ['rgb(190, 18, 60)', 'rgb(67, 56, 202)'] as const;
readonly textColor = computed(() => this.editor.query<string>('textColor'));

setTextColor(color: string): void {
  this.editor.execute('setTextColor', color);
}
```

```html
@for (color of colors; track color) {
  <button
    type="button"
    [class.qalma-command-active]="textColor() === color"
    [disabled]="!editor.canExecute('setTextColor', color)"
    (mousedown)="$event.preventDefault()"
    (click)="setTextColor(color)"
    [style.background-color]="color"
    [attr.aria-label]="'Set text color ' + color"
  ></button>
}
```

## Slash command pick

```typescript
pick(option: { command: string; value?: unknown }): void {
  if (!this.editor.execute('deleteSlashCommand')) {
    return;
  }

  this.editor.execute('splitSlashCommandBlock');
  this.editor.execute(option.command, option.value);
}
```

Inside lists, the docs playground first splits the list item and lifts it out of
the list before running the selected block command. That is app-specific menu
policy, not library behavior.

## Mention pick

```typescript
pickUser(user: { id: string; label: string }): void {
  this.editor.execute('insertMention', {
    id: user.id,
    label: user.label,
  });
}
```

Listen to `qalma-mention-update` and read `query&lt;MentionState&gt;('mention')` to
position and filter your own menu.
