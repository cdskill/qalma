---
title: Color & Highlight
description: Add text color, background color, and highlight marks with ColorPlugin and HighlightPlugin.
---

# Color & Highlight

Qalma separates generic text style colors from highlights:

| Plugin | Purpose |
| ------ | ------- |
| `ColorPlugin` | Adds a `textStyle` mark with `color` and `backgroundColor` attributes. |
| `HighlightPlugin` | Adds a semantic `highlight` mark that serializes to `&lt;mark&gt;`. |

```typescript
import {
  ColorPlugin,
  HighlightPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [...TextFormattingKit, ColorPlugin, HighlightPlugin],
});
```

## ColorPlugin

| Contract | Description |
| -------- | ----------- |
| `setTextColor` | Sets the `color` style on selected text or future typed text. |
| `unsetTextColor` | Removes only the text color attribute from the `textStyle` mark. |
| `setBackgroundColor` | Sets the `background-color` style on selected text or future typed text. |
| `unsetBackgroundColor` | Removes only the background color attribute from the `textStyle` mark. |
| `query&lt;string&gt;('textColor')` | Returns the active normalized text color or `null`. |
| `query&lt;string&gt;('backgroundColor')` | Returns the active normalized background color or `null`. |

`ColorPlugin` accepts CSS color strings as command values. Empty values and
strings containing `;`, `{`, `}`, `&lt;`, or `&gt;` are rejected. In the browser,
Qalma lets the DOM normalize valid CSS colors.

```html
<button
  type="button"
  qalmaCommand="setTextColor"
  [qalmaCommandValue]="'rgb(190, 18, 60)'"
>
  Rose text
</button>

<button
  type="button"
  qalmaCommand="setBackgroundColor"
  [qalmaCommandValue]="'rgb(254, 240, 138)'"
>
  Yellow background
</button>
```

For swatches, read query state and run commands directly.

```typescript
readonly textColor = computed(() => this.editor.query<string>('textColor'));

setTextColor(color: string): void {
  this.editor.execute('setTextColor', color);
}

isTextColorActive(color: string): boolean {
  return this.textColor() === color;
}
```

## HighlightPlugin

`HighlightPlugin` serializes default-color highlights as plain `&lt;mark&gt;`.
Non-default colors serialize as `&lt;mark style="background-color: ..."&gt;`.

| Contract | Description |
| -------- | ----------- |
| `setHighlight` | Sets a highlight. Without a command value, it uses the configured default color. |
| `unsetHighlight` | Removes the highlight mark. |
| `query&lt;string&gt;('highlightColor')` | Returns the active highlight color or `null`. |

```typescript
import { HighlightPlugin } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [
    HighlightPlugin.configure({
      defaultColor: 'rgb(254, 240, 138)',
    }),
  ],
});
```

| Option | Default | Validation |
| ------ | ------- | ---------- |
| `defaultColor` | `'rgb(254, 240, 138)'` | Must be a valid CSS `background-color`. |

```html
<button type="button" qalmaCommand="setHighlight">Highlight</button>

<button
  type="button"
  qalmaCommand="setHighlight"
  [qalmaCommandValue]="'rgb(187, 247, 208)'"
>
  Mint highlight
</button>

<button type="button" qalmaCommand="unsetHighlight">Clear highlight</button>
```

## Serialization

`ColorPlugin` outputs spans with inline style:

```html
<span style="color: rgb(190, 18, 60); background-color: rgb(254, 240, 138);">
  styled text
</span>
```

`HighlightPlugin` outputs `&lt;mark&gt;`, which is useful when highlight is a semantic
annotation rather than a generic background style.
