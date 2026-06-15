// Standard ngx-editor core. The default `Editor` class wires ProseMirror with
// ngx-editor's default schema and plugins (history, keymap, input rules, …).
// We measure the headless editing core, not the optional menu UI component,
// to match the headless surface the other editors are measured at.
import { Editor, schema } from 'ngx-editor';

globalThis.__sink = [Editor, schema];
