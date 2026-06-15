// Standard Quill build (the engine behind ngx-quill). Quill is monolithic:
// the default entry registers core + all formats + the snow theme, which is
// what `import Quill from 'quill'` ships.
import Quill from 'quill';

globalThis.__sink = Quill;
