---
title: Forms Integration
description: Bind Qalma to Angular reactive forms and template-driven forms with the optional value accessor.
---

# Forms Integration

Qalma ships an optional Angular forms adapter through `@qalma/editor/forms`.
Import it only in components that bind the editor to `formControl`,
`formControlName`, or `ngModel`.

The adapter keeps the editor headless:

| Direction | Value |
| --------- | ----- |
| Form to editor | HTML string passed to `editor.setHtml()` |
| Editor to form | Normalized `editor.html()` |
| Empty form value | `''` |
| Empty editor document | `&lt;p&gt;&lt;/p&gt;` internally |

That empty-value mapping is important. Angular validators such as
`Validators.required` see `''` as empty, while the ProseMirror document still
gets the paragraph it needs internally.

## When to reach for the adapter

The adapter exists so Angular can own the field. Reach for it when the editor
lives inside a form and you want validation, `touched`/`dirty`, `disabled`,
`reset()`, or `formControlName` inside a group. If the editor stands on its own,
skip the adapter (and `@angular/forms`) and drive the
[controller](/docs/editor-controller) directly — see [Without forms](#without-forms).

| Your context | Use |
| ------------ | --- |
| A field inside a `<form>`, with validation / `disabled` / `touched` / resets | The adapter: `formControl`, `formControlName`, or `ngModel` |
| A standalone editor you just read and persist | The controller: `html()`, `getJSON()`, `isEmpty()` |

See the live [Form state example](/examples) for validators, reset, disabled
state, touched/dirty state, and the emitted control value working together.

## Reactive Forms

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormResetEvent,
  ReactiveFormsModule,
  TouchedChangeEvent,
  Validators,
  ValueChangeEvent,
} from '@angular/forms';
import {
  HistoryPlugin,
  PlaceholderPlugin,
  QalmaContent,
  QalmaEditor,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaControlValueAccessor } from '@qalma/editor/forms';

@Component({
  selector: 'app-editor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    QalmaControlValueAccessor,
    QalmaEditor,
    QalmaContent,
  ],
  template: `
    <form class="space-y-3" (submit)="submit($event)">
      <qalma-editor
        class="block rounded border"
        [editor]="editor"
        [formControl]="body"
      >
        <qalma-content
          class="block min-h-40 p-4 [&_.ProseMirror]:outline-none"
        />
      </qalma-editor>

      @if (body.invalid && body.touched) {
        <p class="text-sm text-red-600">Write a message before sending.</p>
      }

      <div class="flex gap-2">
        <button type="submit" [disabled]="body.invalid">Send</button>
        <button type="button" (click)="reset()">Reset</button>
        <button type="button" (click)="toggleDisabled()">
          {{ body.disabled ? 'Enable' : 'Disable' }}
        </button>
      </div>

      <pre><code>{{ body.value }}</code></pre>
      <pre><code>{{ events().join(', ') }}</code></pre>
    </form>
  `,
})
export class EditorForm {
  readonly body = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly editor = createQalmaEditor({
    plugins: [
      ...TextFormattingKit,
      PlaceholderPlugin.configure({ placeholder: 'Write your message...' }),
      HistoryPlugin,
    ],
  });

  protected readonly events = signal<readonly string[]>([]);

  constructor() {
    this.body.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof ValueChangeEvent) {
        this.events.update((events) => [...events, 'value']);
      }

      if (event instanceof TouchedChangeEvent && event.touched) {
        this.events.update((events) => [...events, 'touched']);
      }

      if (event instanceof FormResetEvent) {
        this.events.update((events) => [...events, 'reset']);
      }
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.body.markAsTouched();

    if (this.body.invalid) {
      return;
    }

    sendHtmlToApi(this.body.value);
  }

  protected reset(): void {
    this.body.reset('');
  }

  protected toggleDisabled(): void {
    if (this.body.disabled) {
      this.body.enable();
    } else {
      this.body.disable();
    }
  }
}

function sendHtmlToApi(html: string): void {
  console.log(html);
}
```

Use the form control as the source of truth. When an editor is bound to a form,
do not also seed the same document through `createQalmaEditor({ content })`;
that creates two initial values competing for the same surface.

## Template-Driven Forms

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QalmaContent, QalmaEditor, createQalmaEditor } from '@qalma/editor';
import { QalmaControlValueAccessor } from '@qalma/editor/forms';

@Component({
  selector: 'app-editor-ng-model',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, QalmaControlValueAccessor, QalmaEditor, QalmaContent],
  template: `
    <qalma-editor
      [editor]="editor"
      [(ngModel)]="body"
      [ngModelOptions]="{ standalone: true }"
    >
      <qalma-content class="block min-h-40 p-4" />
    </qalma-editor>
  `,
})
export class EditorNgModel {
  protected body = '<p>Draft</p>';
  protected readonly editor = createQalmaEditor();
}
```

When `ngModel` belongs to a template-driven `<form>`, give the editor a
`name` just like any other Angular form control.

## Without forms

When the editor is not part of an Angular form, you do not need the adapter or
`@angular/forms` at all. Keep the controller as the source of truth: read its
`html()` signal, persist with `getJSON()`, and use `isEmpty()` for the same empty
check the adapter performs for `Validators.required`.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QalmaContent, QalmaEditor, createQalmaEditor } from '@qalma/editor';

@Component({
  selector: 'app-standalone-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-content
        class="block min-h-40 p-4 [&_.ProseMirror]:outline-none"
      />
    </qalma-editor>

    <button type="button" [disabled]="editor.isEmpty()" (click)="save()">
      Save
    </button>
  `,
})
export class StandaloneEditor {
  protected readonly editor = createQalmaEditor({
    content: '<p>Draft</p>',
  });

  protected save(): void {
    if (this.editor.isEmpty()) {
      return;
    }

    persistDraft(this.editor.getJSON());
  }
}

function persistDraft(doc: unknown): void {
  localStorage.setItem('qalma-draft', JSON.stringify(doc));
}
```

Here the controller owns the initial content through
`createQalmaEditor({ content })` — which is exactly why you do **not** seed
`content` when a form control is bound: in that case the control is the source of
truth. See [Content & Serialization](/docs/content) for reading and persisting
without a form.

## Behavior

The adapter is intentionally narrow:

- Values are HTML strings. Persist lossless JSON with `editor.getJSON()` and
  `editor.setJSON()` outside the CVA path when your app needs that format.
- `setDisabledState(true)` calls `editor.setEditable(false)`.
- `registerOnTouched()` fires when focus leaves the whole `<qalma-editor>`
  host, so toolbar clicks inside the editor do not mark the control touched.
- Empty editor documents — as reported by
  [`editor.isEmpty()`](/docs/editor-controller#empty-state) — emit `''`, so
  `Validators.required` works with rich text content.

Signal Forms native support is intentionally not part of this adapter yet. The
current CVA works through Angular's compatibility path; a dedicated Signal
Forms adapter can be added later when that API is stable enough to make public.
