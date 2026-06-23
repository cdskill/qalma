import '@angular/compiler';

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  Signal,
  ViewChild,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  FormsModule,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  QalmaEditor,
  QalmaEditorController,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaControlValueAccessor } from '@qalma/editor/forms';

import {
  flushMicrotasks,
  getEditorView,
  insertText,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('QalmaControlValueAccessor', () => {
  beforeAll(() => {
    setupTestBed();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('writes a reactive form value into the editor', async () => {
    const fixture = TestBed.createComponent(PrefilledReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    expect(component.editor.html()).toBe('<p>Draft</p>');
    expect(component.body.value).toBe('<p>Draft</p>');
  });

  it('updates the reactive form value when the editor changes', async () => {
    const fixture = TestBed.createComponent(PrefilledReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    placeCursorAfterText(component.editor, 'Draft');
    insertText(component.editor, '!');
    await fixture.whenStable();

    expect(component.body.value).toBe('<p>Draft!</p>');
  });

  it('normalizes an empty editor document to an empty form value', async () => {
    const fixture = TestBed.createComponent(RequiredReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    expect(component.editor.html()).toBe('<p></p>');
    expect(component.body.value).toBe('');
    expect(component.body.invalid).toBe(true);

    component.editor.setHtml('<p>Hello</p>');
    await fixture.whenStable();

    expect(component.body.value).toBe('<p>Hello</p>');
    expect(component.body.valid).toBe(true);

    component.editor.setHtml('<p></p>');
    await fixture.whenStable();

    expect(component.body.value).toBe('');
    expect(component.body.invalid).toBe(true);
  });

  it('resets an empty form value to the editor empty document', async () => {
    const fixture = TestBed.createComponent(PrefilledReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    component.body.reset('');
    await fixture.whenStable();

    expect(component.body.value).toBe('');
    expect(component.body.pristine).toBe(true);
    expect(component.editor.html()).toBe('<p></p>');
  });

  it('maps the disabled state to editor editability', async () => {
    const fixture = TestBed.createComponent(PrefilledReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    component.body.disable();
    await fixture.whenStable();

    expect(component.editor.editable()).toBe(false);

    component.body.enable();
    await fixture.whenStable();

    expect(component.editor.editable()).toBe(true);
  });

  it('marks touched only after focus leaves the editor host', async () => {
    const fixture = TestBed.createComponent(PrefilledReactiveEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const editorHost = root.querySelector('qalma-editor') as HTMLElement | null;
    const insideButton = root.querySelector(
      '#inside',
    ) as HTMLButtonElement | null;
    const outsideButton = root.querySelector(
      '#outside',
    ) as HTMLButtonElement | null;
    const view = getEditorView(component.editor);

    component.body.markAsUntouched();
    view.dom.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: insideButton,
      }),
    );
    await flushMicrotasks();

    expect(component.body.touched).toBe(false);

    editorHost?.focus();
    view.dom.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outsideButton,
      }),
    );
    await flushMicrotasks();

    expect(component.body.touched).toBe(true);
  });

  it('supports template-driven ngModel binding', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenEditorForm);
    const component = fixture.componentInstance;

    await fixture.whenStable();

    expect(component.editor.html()).toBe('<p>Model</p>');

    component.editor.setHtml('<p>Updated</p>');
    await fixture.whenStable();

    expect(component.body).toBe('<p>Updated</p>');
  });
});

// The real `QalmaEditor`/`QalmaContent` are not used directly here: their signal
// `input.required()` is not recognized when the library entry point is JIT-compiled
// in this vitest setup (it raises NG0303 / NG0950). These doubles mirror the public
// surface the adapter relies on — the `editor()` accessor and the editor-context
// provider token — using a decorator input so the binding resolves under JIT.
@Component({
  selector: 'qalma-editor',
  standalone: true,
  providers: [
    {
      provide: QalmaEditor,
      useExisting: forwardRef(() => TestQalmaEditorHost),
    },
  ],
  template: `<ng-content />`,
})
class TestQalmaEditorHost {
  private readonly editorState = signal(createQalmaEditor());
  readonly editor: Signal<QalmaEditorController> =
    this.editorState.asReadonly();

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input({ alias: 'editor', required: true })
  set editorInput(editor: QalmaEditorController) {
    this.editorState.set(editor);
  }
}

@Component({
  selector: 'qalma-content',
  standalone: true,
  template: `<div #editorHost class="qalma-content-surface"></div>`,
})
class TestQalmaContent implements AfterViewInit, OnDestroy {
  private readonly editorHost = inject(QalmaEditor);

  @ViewChild('editorHost', { static: true })
  private readonly contentHost?: ElementRef<HTMLDivElement>;

  private mountedHost?: HTMLElement;

  ngAfterViewInit(): void {
    const host = this.contentHost?.nativeElement;

    if (!host) {
      return;
    }

    this.editorHost.editor().mount(host);
    this.mountedHost = host;
  }

  ngOnDestroy(): void {
    if (this.mountedHost) {
      this.editorHost.editor().unmount(this.mountedHost);
    }
  }
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TestQalmaContent,
    QalmaControlValueAccessor,
    TestQalmaEditorHost,
  ],
  template: `
    <form>
      <qalma-editor [editor]="editor" [formControl]="body">
        <button id="inside" type="button">Inside</button>
        <qalma-content />
      </qalma-editor>
      <button id="outside" type="button">Outside</button>
    </form>
  `,
})
class PrefilledReactiveEditorForm {
  readonly body = new FormControl('<p>Draft</p>', { nonNullable: true });
  readonly editor = createQalmaEditor();
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TestQalmaContent,
    QalmaControlValueAccessor,
    TestQalmaEditorHost,
  ],
  template: `
    <qalma-editor [editor]="editor" [formControl]="body">
      <qalma-content />
    </qalma-editor>
  `,
})
class RequiredReactiveEditorForm {
  readonly body = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  readonly editor = createQalmaEditor();
}

@Component({
  standalone: true,
  imports: [
    FormsModule,
    TestQalmaContent,
    QalmaControlValueAccessor,
    TestQalmaEditorHost,
  ],
  template: `
    <qalma-editor
      [editor]="editor"
      [(ngModel)]="body"
      [ngModelOptions]="{ standalone: true }"
    >
      <qalma-content />
    </qalma-editor>
  `,
})
class TemplateDrivenEditorForm {
  body = '<p>Model</p>';
  readonly editor = createQalmaEditor();
}
