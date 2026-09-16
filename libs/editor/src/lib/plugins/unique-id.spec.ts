import { UniqueIdPlugin, UniqueIdState } from '../../index';
import {
  flushMicrotasks,
  getEditorView,
  mountEditor,
  selectEditorRange,
} from '../../../testing/editor-test-utils';

describe('UniqueIdPlugin', () => {
  it('assigns stable, serializable IDs to configured nodes', async () => {
    let nextId = 0;
    const mounted = mountEditor({
      content: '<p>One</p><p>Two</p>',
      plugins: [
        UniqueIdPlugin.configure({
          generateId: () => `block-${++nextId}`,
        }),
      ],
    });

    try {
      await flushMicrotasks();

      expect(mounted.editor.html()).toBe(
        '<p data-qalma-id="block-1">One</p><p data-qalma-id="block-2">Two</p>',
      );
      expect(
        mounted.editor
          .getJSON()
          .content?.map((node) => node.attrs?.['qalmaId']),
      ).toEqual(['block-1', 'block-2']);

      selectEditorRange(mounted.editor, 6, 6);
      expect(mounted.editor.query<UniqueIdState>('uniqueId')).toEqual({
        id: 'block-2',
        nodeType: 'paragraph',
        position: 5,
      });
    } finally {
      mounted.unmount();
    }
  });

  it('preserves existing IDs and repairs pasted duplicates', async () => {
    let nextId = 0;
    const mounted = mountEditor({
      content: '<p data-qalma-id="kept">One</p><p data-qalma-id="kept">Two</p>',
      plugins: [
        UniqueIdPlugin.configure({
          generateId: () => `fresh-${++nextId}`,
        }),
      ],
    });

    try {
      await flushMicrotasks();

      expect(mounted.editor.html()).toContain('data-qalma-id="kept"');
      expect(mounted.editor.html()).toContain('data-qalma-id="fresh-1"');

      const view = getEditorView(mounted.editor);
      const paragraph = view.state.schema.nodes['paragraph'].create(
        {},
        view.state.schema.text('Three'),
      );
      view.dispatch(
        view.state.tr.insert(view.state.doc.content.size, paragraph),
      );

      expect(mounted.editor.html()).toContain('data-qalma-id="fresh-2"');
    } finally {
      mounted.unmount();
    }
  });

  it('validates configuration and configured schema nodes', () => {
    expect(() => UniqueIdPlugin.configure({ nodeTypes: [] })).toThrow(
      /unique non-empty node names/,
    );
    expect(() => UniqueIdPlugin.configure({ attributeName: 'id' })).toThrow(
      /data-\*/,
    );
    expect(() =>
      mountEditor({
        plugins: [
          UniqueIdPlugin.configure({
            nodeTypes: ['missingNode'],
          }),
        ],
      }),
    ).toThrow(/unknown node "missingNode"/);
  });
});
