---
title: Mention
description: Build a headless mention autocomplete from MentionPlugin query state, events, and insertMention.
---

# Mention

`MentionPlugin` detects a trigger such as `@ada`, exposes the active range to
your UI, and inserts an inline mention node. It does not fetch users or render a
menu.

```typescript
import { MentionPlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [MentionPlugin],
});
```

## Public API

| Contract                               | Description                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `query&lt;MentionState&gt;('mention')` | Returns `{ from, to, query, trigger }` while a mention query is active.     |
| `insertMention`                        | Replaces the active mention query or current selection with a mention node. |
| `qalma-mention-update`                 | DOM event emitted from the editor view when mention state may have changed. |
| `qalma-mention-keydown`                | Cancelable DOM event for mention menu keys.                                 |

Mention keydown events cover `ArrowDown`, `ArrowUp`, `Escape`, `Enter`, `Tab`,
space, and `Spacebar`.

## Options

```typescript
const editor = createQalmaEditor({
  plugins: [
    MentionPlugin.configure({
      trigger: '@',
      minQueryLength: 0,
      maxQueryLength: 64,
      appendSpaceOnInsert: true,
    }),
  ],
});
```

| Option                | Default | Validation                                         |
| --------------------- | ------- | -------------------------------------------------- |
| `trigger`             | `'@'`   | Single non-whitespace character.                   |
| `minQueryLength`      | `0`     | Non-negative integer.                              |
| `maxQueryLength`      | `64`    | Integer greater than or equal to `minQueryLength`. |
| `appendSpaceOnInsert` | `true`  | Boolean.                                           |

Mentions are detected only when the selection is collapsed, the cursor is not
inside a code block or inline code mark, the trigger starts the parent text or
follows whitespace, and the query contains no whitespace.

## Insert a mention

`insertMention` expects an object with `id` and `label`. The trigger is optional
and defaults to the plugin trigger.

```typescript
editor.execute('insertMention', {
  id: 'ada-lovelace',
  label: 'Ada Lovelace',
});
```

The mention serializes as a non-editable span:

```html
<!-- prettier-ignore -->
<span
  data-qalma-mention
  data-mention-id="ada-lovelace"
  data-mention-label="Ada Lovelace"
  data-mention-trigger="@"
  contenteditable="false"
>
  @Ada Lovelace
</span>
```

## Menu pattern

Listen for the plugin events on the `&lt;qalma-content&gt;` host and read query state
from the controller.

```typescript
afterNextRender(() => {
  const surface = this.mentionSurface().nativeElement;

  const refresh = () => this.refreshMentions();
  const keydown = (event: Event) => this.handleMentionKeydown(event);

  surface.addEventListener('qalma-mention-update', refresh);
  surface.addEventListener('qalma-mention-keydown', keydown);

  this.destroyRef.onDestroy(() => {
    surface.removeEventListener('qalma-mention-update', refresh);
    surface.removeEventListener('qalma-mention-keydown', keydown);
  });
});
```

```typescript
refreshMentions(): void {
  const mention = this.editor.query<MentionState>('mention');

  if (!mention) {
    this.suggestions.set([]);
    return;
  }

  this.suggestions.set(
    this.people.filter((person) =>
      person.label.toLowerCase().includes(mention.query.toLowerCase()),
    ),
  );
}

pick(person: { id: string; label: string }): void {
  this.editor.execute('insertMention', person);
}
```

If your menu handles a navigation key, call `event.preventDefault()` on the
custom event. The plugin then prevents the original editor keydown.
