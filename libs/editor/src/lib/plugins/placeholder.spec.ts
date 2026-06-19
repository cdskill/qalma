import {
  PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS,
  PlaceholderPlugin,
} from '../../index';
import { mountEditor } from '../../../testing/editor-test-utils';

describe('PlaceholderPlugin', () => {
  it('decorates the only empty textblock without changing serialized HTML', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [
        PlaceholderPlugin.configure({
          placeholder: 'Start here',
          className: 'custom-placeholder',
        }),
      ],
    });

    try {
      const { editor, host } = mounted;
      const placeholder = host.querySelector(
        '.custom-placeholder[data-placeholder="Start here"]',
      );

      expect(PlaceholderPlugin.key).toBe('placeholder');
      expect(placeholder?.tagName).toBe('P');
      expect(editor.html()).toBe('<p></p>');

      editor.setHtml('<p>Qalma</p>');

      expect(
        host.querySelector(
          '.custom-placeholder[data-placeholder="Start here"]',
        ),
      ).toBeNull();
      expect(editor.html()).toBe('<p>Qalma</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = PlaceholderPlugin.configure({
      placeholder: 'Start here',
      className: 'custom-placeholder',
    });

    expect(Object.isFrozen(PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(PlaceholderPlugin.options)).toBe(true);
    expect(PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS).toEqual({
      placeholder: 'Write something...',
      className: 'qalma-placeholder',
    });
    expect(PlaceholderPlugin.options).toEqual(
      PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      placeholder: 'Start here',
      className: 'custom-placeholder',
    });
    expect(() =>
      PlaceholderPlugin.configure({
        placeholder: '',
      }),
    ).toThrowError('PlaceholderPlugin placeholder must be a non-empty string.');
    expect(() =>
      PlaceholderPlugin.configure({
        className: 'bad placeholder',
      }),
    ).toThrowError(
      'PlaceholderPlugin className must be a non-empty CSS class name.',
    );
  });
});
