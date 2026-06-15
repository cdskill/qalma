---
title: Forms Integration
description: Synchronize Qalma's html signal with Angular forms without creating update loops.
---

# Forms Integration

Qalma does not ship a `ControlValueAccessor`. The editor controller already
exposes the two operations a form needs:

| Direction | API |
| --------- | --- |
| Editor to form | Read `editor.html()` |
| Form to editor | Call `editor.setHtml(html)` |

This keeps form policy in your app: validation, save timing, dirty state,
debouncing, and backend shape.

## Reactive Forms

```typescript
import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  HistoryPlugin,
  QalmaContent,
  QalmaEditor,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

@Component({
  selector: 'app-editor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QalmaEditor, QalmaContent],
  template: `
    <form>
      <qalma-editor [editor]="editor">
        <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
      </qalma-editor>

      <textarea class="sr-only" [formControl]="body"></textarea>
    </form>
  `,
})
export class EditorForm {
  readonly body = new FormControl('<p>Draft</p>', { nonNullable: true });

  protected readonly editor = createQalmaEditor({
    content: this.body.value,
    plugins: [...TextFormattingKit, HistoryPlugin],
  });

  constructor() {
    effect(() => {
      const html = this.editor.html();

      if (this.body.value !== html) {
        this.body.setValue(html, { emitEvent: false });
      }
    });

    this.body.valueChanges.pipe(takeUntilDestroyed()).subscribe((html) => {
      if (html !== this.editor.html()) {
        this.editor.setHtml(html);
      }
    });
  }
}
```

The two equality checks are important. They prevent the form subscription and
the editor signal effect from writing the same value back to each other.

## Validation

Validate the serialized HTML or derive text from it in app code.

```typescript
readonly characterCount = computed(() =>
  this.editor.html().replace(/<[^>]+>/g, '').trim().length,
);

readonly tooLong = computed(() => this.characterCount() > 5000);
```

For schema-level restrictions, choose plugins and plugin options. For example,
do not include `ImagePlugin` when a field must be text-only, or configure
`HeadingsPlugin` with only the heading levels that field supports.

## Read-only mode

Forms often need preview or locked states. Keep the editor mounted and toggle
editability.

```typescript
setDisabled(disabled: boolean): void {
  this.editor.setEditable(!disabled);
}
```

When read-only, `execute()` and `canExecute()` return false, but the HTML signal
and queries still work.
