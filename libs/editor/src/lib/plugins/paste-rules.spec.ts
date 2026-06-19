import {
  ColorPlugin,
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  PASTE_RULES_PLUGIN_DEFAULT_OPTIONS,
  PasteRulesPlugin,
} from '../../index';
import { mountEditor, pasteClipboard } from '../../../testing/editor-test-utils';

describe('PasteRulesPlugin', () => {
  it('autolinks plain text URLs when the link mark is available', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, PasteRulesPlugin],
    });

    try {
      const event = pasteClipboard(mounted.editor, {
        text: 'Read https://angular.dev/docs.',
      });

      expect(PasteRulesPlugin.key).toBe('pasteRules');
      expect(event.defaultPrevented).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<p>Read <a href="https://angular.dev/docs" target="_blank" rel="noopener noreferrer">https://angular.dev/docs</a>.</p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('cleans pasted HTML links and drops unsupported markup', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, ColorPlugin, PasteRulesPlugin],
    });

    try {
      const event = pasteClipboard(mounted.editor, {
        html: '<a href="/docs" class="text-red-500" style="color: red;"><span style="color: red;">Docs</span><script>alert(1)</script></a>',
        text: 'Docs',
      });

      expect(event.defaultPrevented).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<p><a href="/docs" target="_blank" rel="noopener noreferrer">Docs</a></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('uses clipboard URL metadata when pasted HTML omits the anchor', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, ColorPlugin, PasteRulesPlugin],
    });

    try {
      pasteClipboard(mounted.editor, {
        html: '<span style="color: red;">Server-Side Rendering</span>',
        text: 'Server-Side Rendering',
        uriList: 'https://analogjs.org/docs/features/server-side-rendering',
      });

      expect(mounted.editor.html()).toBe(
        '<p><a href="https://analogjs.org/docs/features/server-side-rendering" target="_blank" rel="noopener noreferrer">Server-Side Rendering</a></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('leaves plain text unlinked when autolink is disabled', () => {
    const textMounted = mountEditor({
      content: '<p></p>',
      plugins: [
        LinkPlugin,
        PasteRulesPlugin.configure({
          autolink: false,
        }),
      ],
    });

    try {
      pasteClipboard(textMounted.editor, {
        text: 'https://angular.dev',
      });

      expect(textMounted.editor.html()).toBe('<p>https://angular.dev</p>');
    } finally {
      textMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = PasteRulesPlugin.configure({
      allowedProtocols: ['https'],
      allowRelativeLinks: false,
      defaultProtocol: 'https',
    });

    expect(Object.isFrozen(PASTE_RULES_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(PasteRulesPlugin.options)).toBe(true);
    expect(PASTE_RULES_PLUGIN_DEFAULT_OPTIONS).toEqual({
      autolink: true,
      allowedProtocols: LINK_PLUGIN_DEFAULT_OPTIONS.allowedProtocols,
      allowRelativeLinks: true,
      cleanHtml: true,
      defaultProtocol: 'https',
    });
    expect(PasteRulesPlugin.options).toEqual(
      PASTE_RULES_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      autolink: true,
      allowedProtocols: ['https'],
      allowRelativeLinks: false,
      cleanHtml: true,
      defaultProtocol: 'https',
    });
    expect(() =>
      PasteRulesPlugin.configure({
        autolink: 'yes' as never,
      }),
    ).toThrowError('PasteRulesPlugin autolink must be a boolean.');
    expect(() =>
      PasteRulesPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'PasteRulesPlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      PasteRulesPlugin.configure({
        allowedProtocols: ['https:'],
      }),
    ).toThrowError(
      'PasteRulesPlugin allowedProtocols entries must be protocol names without colons.',
    );
    expect(() =>
      PasteRulesPlugin.configure({
        defaultProtocol: 'ftp' as never,
      }),
    ).toThrowError(
      'PasteRulesPlugin defaultProtocol must be "http" or "https".',
    );
    expect(() =>
      PasteRulesPlugin.configure({
        allowedProtocols: ['mailto'],
      }),
    ).toThrowError(
      'PasteRulesPlugin defaultProtocol must be included in allowedProtocols.',
    );
  });
});
