import {
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  createQalmaEditor,
} from '@qalma/editor';
import type {
  LinkClickEvent,
  QalmaEditorController,
  QalmaPlugin,
} from '@qalma/editor';
import { describe, expect, it } from 'vitest';

const LINK_CONTENT =
  '<p><a href="https://angular.dev" target="_blank" rel="noopener noreferrer">Angular</a></p>';

describe('LinkPlugin', () => {
  it('exposes configurable link click defaults and validation', () => {
    const onClick = (): void => undefined;
    const configured = LinkPlugin.configure({ onClick });

    expect(LINK_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
      onClick: null,
    });
    expect(LinkPlugin.options).toEqual(LINK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options.onClick).toBe(onClick);
    expect(() =>
      LinkPlugin.configure({
        onClick: 'open' as never,
      }),
    ).toThrow('LinkPlugin onClick must be a function or null.');
  });

  it('leaves link click navigation to consumer-owned behavior', () => {
    const defaultMounted = mountLinkEditor([LinkPlugin]);
    const defaultEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    try {
      expect(defaultMounted.link.dispatchEvent(defaultEvent)).toBe(true);
      expect(defaultEvent.defaultPrevented).toBe(false);
    } finally {
      defaultMounted.editor.unmount(defaultMounted.host);
      defaultMounted.host.remove();
    }

    const captured: LinkClickEvent[] = [];
    const configuredMounted = mountLinkEditor([
      LinkPlugin.configure({
        onClick: (event) => {
          captured.push(event);
        },
      }),
    ]);
    const configuredEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    try {
      expect(configuredMounted.link.dispatchEvent(configuredEvent)).toBe(false);
      expect(configuredEvent.defaultPrevented).toBe(true);

      const [linkClick] = captured;

      if (!linkClick) {
        throw new Error('Expected link click event.');
      }

      expect(linkClick.event).toBe(configuredEvent);
      expect(linkClick.element).toBe(configuredMounted.link);
      expect(linkClick.href).toBe('https://angular.dev');
      expect(linkClick.target).toBe('_blank');
      expect(linkClick.rel).toBe('noopener noreferrer');
      expect(linkClick.text).toBe('Angular');
    } finally {
      configuredMounted.editor.unmount(configuredMounted.host);
      configuredMounted.host.remove();
    }
  });
});

function mountLinkEditor(plugins: readonly QalmaPlugin[]): {
  editor: QalmaEditorController;
  host: HTMLElement;
  link: HTMLAnchorElement;
} {
  const editor = createQalmaEditor({
    content: LINK_CONTENT,
    plugins,
  });
  const host = document.createElement('div');

  document.body.append(host);
  editor.mount(host);

  const link = host.querySelector<HTMLAnchorElement>('a[href]');

  if (!link) {
    editor.unmount(host);
    host.remove();

    throw new Error('Expected editor link.');
  }

  return {
    editor,
    host,
    link,
  };
}
