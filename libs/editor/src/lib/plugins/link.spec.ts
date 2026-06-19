import {
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  LinkState,
} from '../../index';
import {
  getEditorSelectionFrom,
  mountEditor,
  selectEditorRange,
  selectText,
} from '../../../testing/editor-test-utils';

describe('LinkPlugin', () => {
  it('exposes stable link commands, command state, and query state', () => {
    const mounted = mountEditor({
      content: '<p>Qalma link</p>',
      plugins: [LinkPlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Qalma');

      expect(LinkPlugin.key).toBe('link');
      expect(editor.hasCommandState('setLink')).toBe(true);
      expect(editor.hasQuery('link')).toBe(true);
      expect(editor.canExecute('setLink', 'javascript:alert(1)')).toBe(false);
      expect(
        editor.execute('setLink', {
          href: '/docs',
        }),
      ).toBe(true);
      expect(editor.isCommandActive('setLink')).toBe(true);
      expect(editor.query<LinkState>('link')).toEqual({
        from: 1,
        to: 6,
        href: '/docs',
        target: '_blank',
        rel: 'noopener noreferrer',
        text: 'Qalma',
      });
      expect(editor.html()).toBe(
        '<p><a href="/docs" target="_blank" rel="noopener noreferrer">Qalma</a> link</p>',
      );

      selectText(editor, 'link');

      expect(editor.execute('selectLink', { from: 1, to: 6 })).toBe(true);
      expect(getEditorSelectionFrom(editor)).toBe(1);
      expect(editor.execute('unsetLink')).toBe(true);
      expect(editor.isCommandActive('setLink')).toBe(false);
      expect(editor.query<LinkState>('link')).toBeNull();
      expect(editor.html()).toBe('<p>Qalma link</p>');
      expect(editor.execute('unsetLink')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('parses and serializes allowed links while dropping unsafe hrefs', () => {
    const mounted = mountEditor({
      content:
        '<p><a href="https://angular.dev" target="_blank" rel="noopener">Angular</a> <a href="javascript:alert(1)">bad</a></p>',
      plugins: [LinkPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p><a href="https://angular.dev" target="_blank" rel="noopener">Angular</a> bad</p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('honors configured link defaults and relative-link restrictions', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [
        LinkPlugin.configure({
          allowRelativeLinks: false,
          defaultTarget: null,
          defaultRel: null,
        }),
      ],
    });

    try {
      const { editor } = mounted;

      selectEditorRange(editor, 1, 6);

      expect(editor.execute('setLink', '/docs')).toBe(false);
      expect(editor.execute('setLink', 'https://angular.dev')).toBe(true);
      expect(editor.html()).toBe(
        '<p><a href="https://angular.dev">Qalma</a></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('dispatches configured link click events without navigating', () => {
    const onClick = vi.fn();
    const mounted = mountEditor({
      content:
        '<p><a href="https://angular.dev" target="_blank" rel="noopener noreferrer">Angular</a></p>',
      plugins: [
        LinkPlugin.configure({
          onClick,
        }),
      ],
    });

    try {
      const link = mounted.host.querySelector('a');

      if (!link) {
        throw new Error('Expected a rendered link.');
      }

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          element: link,
          href: 'https://angular.dev',
          rel: 'noopener noreferrer',
          target: '_blank',
          text: 'Angular',
        }),
      );
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = LinkPlugin.configure({
      allowedProtocols: ['https'],
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'nofollow',
    });

    expect(Object.isFrozen(LINK_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(LinkPlugin.options)).toBe(true);
    expect(LINK_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
      onClick: null,
    });
    expect(LinkPlugin.options).toEqual(LINK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['https'],
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'nofollow',
      onClick: null,
    });
    expect(() =>
      LinkPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'LinkPlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      LinkPlugin.configure({
        allowedProtocols: ['https:'],
      }),
    ).toThrowError(
      'LinkPlugin allowedProtocols entries must be protocol names without colons.',
    );
    expect(() =>
      LinkPlugin.configure({
        defaultTarget: '_self' as never,
      }),
    ).toThrowError('LinkPlugin defaultTarget must be "_blank" or null.');
    expect(() =>
      LinkPlugin.configure({
        defaultRel: '',
      }),
    ).toThrowError('LinkPlugin defaultRel must be a non-empty string or null.');
    expect(() =>
      LinkPlugin.configure({
        onClick: 'open' as never,
      }),
    ).toThrowError('LinkPlugin onClick must be a function or null.');
  });
});
