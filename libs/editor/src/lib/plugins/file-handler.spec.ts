import { vi } from 'vitest';

import { FileHandlerPlugin, QalmaFileHandlerEvent } from '../../index';
import { getEditorView, mountEditor } from '../../../testing/editor-test-utils';

describe('FileHandlerPlugin', () => {
  it('exposes accepted pasted files without prescribing upload behavior', () => {
    const onPaste = vi.fn<(event: QalmaFileHandlerEvent) => boolean>(
      () => true,
    );
    const mounted = mountEditor({
      plugins: [
        FileHandlerPlugin.configure({
          allowedMimeTypes: ['image/*'],
          onPaste,
        }),
      ],
    });

    try {
      const image = new File(['image'], 'cover.png', { type: 'image/png' });
      const text = new File(['text'], 'notes.txt', { type: 'text/plain' });
      const event = createClipboardEvent([image, text]);

      getEditorView(mounted.editor).dom.dispatchEvent(event);

      expect(onPaste).toHaveBeenCalledOnce();
      expect(onPaste.mock.calls[0]?.[0]).toMatchObject({
        files: [image],
        position: 1,
        html: '<p>clipboard</p>',
        text: 'clipboard',
      });
      expect(event.defaultPrevented).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('reports the drop position and leaves rejected files untouched', () => {
    const onDrop = vi.fn<(event: QalmaFileHandlerEvent) => boolean>(() => true);
    const mounted = mountEditor({
      plugins: [
        FileHandlerPlugin.configure({
          allowedMimeTypes: ['application/pdf'],
          onDrop,
        }),
      ],
    });

    try {
      const view = getEditorView(mounted.editor);
      vi.spyOn(view, 'posAtCoords').mockReturnValue({
        pos: 1,
        inside: 0,
      });
      const rejected = createDropEvent([
        new File(['image'], 'cover.png', { type: 'image/png' }),
      ]);

      view.dom.dispatchEvent(rejected);
      expect(onDrop).not.toHaveBeenCalled();

      const pdf = new File(['pdf'], 'brief.pdf', {
        type: 'application/pdf',
      });
      const accepted = createDropEvent([pdf]);

      view.dom.dispatchEvent(accepted);
      expect(onDrop.mock.calls[0]?.[0]).toMatchObject({
        files: [pdf],
        position: 1,
      });
      expect(accepted.defaultPrevented).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('validates MIME filters and callbacks', () => {
    expect(() =>
      FileHandlerPlugin.configure({
        allowedMimeTypes: ['image'],
      }),
    ).toThrow(/valid MIME types/);
    expect(() =>
      FileHandlerPlugin.configure({
        onPaste: 'upload' as unknown as null,
      }),
    ).toThrow(/onPaste/);
  });
});

function createClipboardEvent(files: readonly File[]): ClipboardEvent {
  const event = new Event('paste', {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: createTransfer(files),
  });

  return event;
}

function createDropEvent(files: readonly File[]): DragEvent {
  const event = new MouseEvent('drop', {
    bubbles: true,
    cancelable: true,
    clientX: 10,
    clientY: 10,
  }) as DragEvent;

  Object.defineProperty(event, 'dataTransfer', {
    value: createTransfer(files),
  });

  return event;
}

function createTransfer(files: readonly File[]) {
  return {
    files,
    getData: (type: string) =>
      type === 'text/html' ? '<p>clipboard</p>' : 'clipboard',
  };
}
