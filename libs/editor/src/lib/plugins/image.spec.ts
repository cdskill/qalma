import {
  IMAGE_PLUGIN_DEFAULT_OPTIONS,
  ImagePlugin,
  ImageState,
} from '../../index';
import {
  mountEditor,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('ImagePlugin', () => {
  it('exposes stable image commands, command state, and query state', () => {
    const mounted = mountEditor({
      content: '<p>Before</p>',
      plugins: [ImagePlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, 'Before');

      expect(ImagePlugin.key).toBe('image');
      expect(editor.hasCommandState('insertImage')).toBe(true);
      expect(editor.hasQuery('image')).toBe(true);
      expect(editor.execute('updateImage', '/updated.png')).toBe(false);
      expect(editor.execute('insertImage', 'javascript:alert(1)')).toBe(false);

      expect(
        editor.execute('insertImage', {
          src: 'https://example.com/photo.png',
          alt: ' Example photo ',
          title: ' Photo ',
        }),
      ).toBe(true);
      expect(editor.isCommandActive('insertImage')).toBe(true);
      expect(editor.query<ImageState>('image')).toEqual({
        from: 7,
        to: 8,
        src: 'https://example.com/photo.png',
        alt: 'Example photo',
        title: 'Photo',
        previewSrc: null,
      });
      expect(editor.html()).toBe(
        '<p>Before<img src="https://example.com/photo.png" alt="Example photo" title="Photo"></p>',
      );

      expect(
        editor.execute('updateImage', {
          src: 'https://example.com/updated.png',
          alt: 'Updated photo',
        }),
      ).toBe(true);
      expect(editor.query<ImageState>('image')?.src).toBe(
        'https://example.com/updated.png',
      );
      expect(editor.html()).toBe(
        '<p>Before<img src="https://example.com/updated.png" alt="Updated photo" title="Photo"></p>',
      );

      expect(editor.execute('removeImage')).toBe(true);
      expect(editor.query<ImageState>('image')).toBeNull();
      expect(editor.html()).toBe('<p>Before</p>');
      expect(editor.execute('removeImage')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('keeps preview sources in state but out of serialized HTML', () => {
    const mounted = mountEditor({
      content: '<p>Before</p>',
      plugins: [ImagePlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, 'Before');

      expect(
        editor.execute('insertImage', {
          src: '/uploads/photo.png',
          alt: 'Uploaded photo',
          title: 'Photo',
          previewSrc: 'blob:http://localhost/photo-preview',
        }),
      ).toBe(true);
      expect(editor.query<ImageState>('image')?.previewSrc).toBe(
        'blob:http://localhost/photo-preview',
      );
      expect(editor.html()).toBe(
        '<p>Before<img src="/uploads/photo.png" alt="Uploaded photo" title="Photo"></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized images and ignores unsafe sources', () => {
    const mounted = mountEditor({
      content:
        '<img src="https://example.com/photo.png" alt="Example" title="Photo"><img src="javascript:alert(1)" alt="Bad">',
      plugins: [ImagePlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p><img src="https://example.com/photo.png" alt="Example" title="Photo"></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('honors configured protocol and default alt options', () => {
    const mounted = mountEditor({
      content: '<p>Before</p>',
      plugins: [
        ImagePlugin.configure({
          allowedProtocols: ['https'],
          allowRelativeImages: false,
          defaultAlt: 'Image',
        }),
      ],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, 'Before');

      expect(editor.execute('insertImage', '/relative.png')).toBe(false);
      expect(
        editor.execute('insertImage', 'http://example.com/photo.png'),
      ).toBe(false);
      expect(
        editor.execute('insertImage', 'https://example.com/photo.png'),
      ).toBe(true);
      expect(editor.query<ImageState>('image')?.alt).toBe('Image');
      expect(editor.html()).toBe(
        '<p>Before<img src="https://example.com/photo.png" alt="Image"></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = ImagePlugin.configure({
      allowedProtocols: ['https'],
      allowRelativeImages: false,
      defaultAlt: 'Image',
    });

    expect(Object.isFrozen(IMAGE_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(ImagePlugin.options)).toBe(true);
    expect(IMAGE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https'],
      allowRelativeImages: true,
      defaultAlt: '',
    });
    expect(ImagePlugin.options).toEqual(IMAGE_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['https'],
      allowRelativeImages: false,
      defaultAlt: 'Image',
    });
    expect(() =>
      ImagePlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'ImagePlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      ImagePlugin.configure({
        allowedProtocols: ['https', 'https'],
      }),
    ).toThrowError('ImagePlugin allowedProtocols entries must be unique.');
    expect(() =>
      ImagePlugin.configure({
        allowedProtocols: ['https:'],
      }),
    ).toThrowError(
      'ImagePlugin allowedProtocols entries must be protocol names without colons.',
    );
    expect(() =>
      ImagePlugin.configure({
        allowRelativeImages: 'yes' as never,
      }),
    ).toThrowError('ImagePlugin allowRelativeImages must be a boolean.');
    expect(() =>
      ImagePlugin.configure({
        defaultAlt: null as never,
      }),
    ).toThrowError('ImagePlugin defaultAlt must be a string.');
  });
});
