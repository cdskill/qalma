import { TestBed } from '@angular/core/testing';
import {
  BlockquotePlugin,
  HEADINGS_PLUGIN_DEFAULT_OPTIONS,
  HeadingsPlugin,
  HISTORY_PLUGIN_DEFAULT_OPTIONS,
  HistoryPlugin,
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  createRteEditor,
} from '@angular-rte/editor';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should render the editor sandbox title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'ProseMirror editor foundation',
    );
    expect(compiled.querySelectorAll('[role="toolbar"] button')).toHaveLength(
      17,
    );
    expect(compiled.querySelector('[aria-label="Link URL"]')).toBeNull();
    expect(compiled.querySelector('.ProseMirror')?.textContent).toContain(
      'Angular RTE',
    );
    expect(compiled.querySelector('.ProseMirror ul')?.textContent).toContain(
      'Compose plugins in TypeScript.',
    );
    expect(compiled.querySelector('.ProseMirror ol')?.textContent).toContain(
      'Pick capabilities for the current product surface.',
    );
    expect(
      compiled.querySelector('.ProseMirror blockquote')?.textContent,
    ).toContain(
      'Quote important passages without taking ownership away from the consuming app.',
    );
  });

  it('should expose blockquote commands through the public plugin', () => {
    const editor = createRteEditor({
      content: '<p>Quoted text</p>',
      plugins: [BlockquotePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(BlockquotePlugin.key).toBe('blockquote');
    expect(editor.execute('toggleBlockquote')).toBeTrue();
    expect(editor.isCommandActive('toggleBlockquote')).toBeTrue();
    expect(editor.html()).toBe('<blockquote><p>Quoted text</p></blockquote>');
    expect(editor.execute('toggleBlockquote')).toBeTrue();
    expect(editor.isCommandActive('toggleBlockquote')).toBeFalse();
    expect(editor.html()).toBe('<p>Quoted text</p>');

    editor.unmount(host);
  });

  it('should expose configurable headings defaults and validation', () => {
    const configured = HeadingsPlugin.configure({
      levels: [2, 3, 4],
    });

    expect(HEADINGS_PLUGIN_DEFAULT_OPTIONS).toEqual({
      levels: [1, 2, 3],
    });
    expect(HeadingsPlugin.options).toEqual(HEADINGS_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      levels: [2, 3, 4],
    });
    expect(() =>
      HeadingsPlugin.configure({
        levels: [],
      }),
    ).toThrowError(
      'HeadingsPlugin levels must include at least one heading level.',
    );
    expect(() =>
      HeadingsPlugin.configure({
        levels: [1, 1],
      }),
    ).toThrowError('HeadingsPlugin levels entries must be unique.');
  });

  it('should expose configurable history defaults', () => {
    const configured = HistoryPlugin.configure({
      depth: 200,
    });

    expect(HISTORY_PLUGIN_DEFAULT_OPTIONS).toEqual({
      depth: 100,
      newGroupDelay: 500,
    });
    expect(HistoryPlugin.options).toEqual(HISTORY_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      depth: 200,
      newGroupDelay: 500,
    });
  });

  it('should expose configurable link defaults and validation', () => {
    const configured = LinkPlugin.configure({
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    });

    expect(LINK_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    });
    expect(LinkPlugin.options).toEqual(LINK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    });
    expect(() =>
      LinkPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'LinkPlugin allowedProtocols must include at least one protocol.',
    );
  });
});
