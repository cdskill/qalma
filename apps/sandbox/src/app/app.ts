import { Component } from '@angular/core';
import {
  HistoryPlugin,
  RteCommand,
  RteContent,
  RteEditor,
  RteToolbar,
  TextFormattingKit,
  createRteEditor,
} from '@angular-rte/editor';

@Component({
  imports: [RteCommand, RteContent, RteEditor, RteToolbar],
  selector: 'app-root',
  template: `
    <main
      class="mx-auto min-h-screen w-[min(1080px,calc(100vw-32px))] bg-slate-100 px-0 py-12 font-sans text-slate-900"
    >
      <header class="mb-6">
        <p class="mb-1.5 text-sm font-bold uppercase text-slate-600">
          Angular RTE
        </p>
        <h1 class="text-4xl font-extrabold leading-tight text-slate-950">
          ProseMirror editor foundation
        </h1>
      </header>

      <rte-editor
        class="block overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm"
        [editor]="editor"
      >
        <rte-toolbar
          class="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2"
        >
          <button
            type="button"
            [class]="commandClass"
            rteCommand="toggleBold"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            [class]="commandClass"
            rteCommand="toggleItalic"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            [class]="commandClass"
            rteCommand="toggleUnderline"
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            [class]="commandClass"
            rteCommand="toggleStrike"
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
          <button
            type="button"
            [class]="commandClass"
            rteCommand="undo"
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            [class]="commandClass"
            rteCommand="redo"
            title="Redo"
          >
            Redo
          </button>
        </rte-toolbar>

        <rte-content
          class="block min-h-64 p-4 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-3"
        />
      </rte-editor>

      <section class="mt-6" aria-label="Serialized HTML">
        <h2 class="mb-2.5 text-lg font-bold text-slate-900">Serialized HTML</h2>
        <pre
          class="m-0 overflow-auto rounded-lg border border-slate-300 bg-white p-4 font-mono text-sm leading-6 text-slate-700"
          >{{ editor.html() }}</pre
        >
      </section>
    </main>
  `,
})
export class App {
  protected readonly editor = createRteEditor({
    content:
      '<p><strong>Angular RTE</strong> starts with inline text formatting.</p><p>Try <em>italic</em>, <u>underline</u>, and <s>strikethrough</s> from a consumer-owned toolbar.</p>',
    placeholder: 'Start writing...',
    plugins: [
      ...TextFormattingKit,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly commandClass =
    'min-h-8 min-w-8 rounded-md border border-slate-300 bg-white px-2.5 text-center text-sm font-semibold leading-none text-slate-700 transition hover:border-sky-600 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-45 [&.rte-command-active]:border-sky-600 [&.rte-command-active]:bg-sky-50 [&.rte-command-active]:text-sky-900';
}
