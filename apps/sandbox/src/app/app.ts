import { Component } from '@angular/core';

import { SandboxEditor } from './sandbox-editor';

@Component({
  imports: [SandboxEditor],
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

      <app-sandbox-editor />
    </main>
  `,
})
export class App {}
