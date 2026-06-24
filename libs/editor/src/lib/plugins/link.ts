import { Mark, MarkSpec, MarkType, ResolvedPos } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  TextSelection,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
} from './qalma-plugin';
import { isMarkActive } from '../prosemirror/queries';

export interface LinkCommandValue {
  href: string;
  target?: '_blank' | null;
  rel?: string | null;
}

export type LinkCommandInput = string | LinkCommandValue;

export interface LinkState extends LinkCommandValue {
  from: number;
  to: number;
  text: string;
}

export interface LinkClickEvent extends LinkCommandValue {
  target: '_blank' | null;
  rel: string | null;
  event: MouseEvent;
  element: HTMLAnchorElement;
  text: string;
}

export type LinkClickHandler = (event: LinkClickEvent) => void;

export interface LinkElementTarget {
  element: HTMLAnchorElement;
}

export interface LinkRangeTarget {
  from: number;
  to: number;
}

export type LinkSelectionTarget = LinkElementTarget | LinkRangeTarget;

export interface LinkPluginOptions {
  allowedProtocols: readonly string[];
  allowRelativeLinks: boolean;
  defaultTarget: '_blank' | null;
  defaultRel: string | null;
  onClick: LinkClickHandler | null;
}

export const LINK_PLUGIN_DEFAULT_OPTIONS: Readonly<LinkPluginOptions> =
  Object.freeze({
    allowedProtocols: Object.freeze(['http', 'https', 'mailto', 'tel']),
    allowRelativeLinks: true,
    defaultTarget: '_blank',
    defaultRel: 'noopener noreferrer',
    onClick: null,
  });

export const LinkPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  LINK_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertLinkPluginOptions(options);

    const linkMark: MarkSpec = {
      attrs: {
        href: {},
        target: { default: null },
        rel: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) {
              return false;
            }

            const href = normalizeHref(node.getAttribute('href'), options);

            if (!href) {
              return false;
            }

            return {
              href,
              target: normalizeTarget(
                node.getAttribute('target') ?? options.defaultTarget,
              ),
              rel: normalizeRel(node.getAttribute('rel') ?? options.defaultRel),
            };
          },
        },
      ],
      toDOM: (mark) => {
        const attrs: Record<string, string> = {
          href: mark.attrs['href'],
        };
        const target = normalizeTarget(mark.attrs['target']);
        const rel = normalizeRel(mark.attrs['rel']);

        if (target) {
          attrs['target'] = target;
        }

        if (rel) {
          attrs['rel'] = rel;
        }

        return ['a', attrs, 0];
      },
    };

    return createQalmaPlugin({
      key: 'link',
      marks: {
        link: linkMark,
      },
      commands: (schema) => ({
        setLink: createSetLinkCommand(schema.marks['link'], options),
        selectLink: createSelectLinkCommand(schema.marks['link']),
        unsetLink: createUnsetLinkCommand(schema.marks['link']),
      }),
      commandStates: (schema) => ({
        setLink: (state) => isMarkActive(state, schema.marks['link']),
      }),
      queries: (schema) => ({
        link: (state) => getLinkState(state, schema.marks['link']),
      }),
      prosemirrorPlugins: () =>
        options.onClick
          ? [createLinkClickPlugin(options, options.onClick)]
          : [],
    });
  },
);

function createSetLinkCommand(
  mark: MarkType,
  options: Readonly<LinkPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const attrs = resolveLinkAttrs(value, options);

    if (!attrs || !selectionAllowsMark(state, mark)) {
      return false;
    }

    if (dispatch) {
      const transaction = state.tr;

      if (state.selection.empty) {
        transaction.addStoredMark(mark.create(attrs));
      } else {
        for (const range of state.selection.ranges) {
          transaction.removeMark(range.$from.pos, range.$to.pos, mark);
          transaction.addMark(
            range.$from.pos,
            range.$to.pos,
            mark.create(attrs),
          );
        }
      }

      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

function createUnsetLinkCommand(mark: MarkType): QalmaCommandHandler {
  return (state, dispatch) => {
    if (!isMarkActive(state, mark)) {
      return false;
    }

    if (dispatch) {
      const transaction = state.tr.removeStoredMark(mark);

      for (const range of state.selection.ranges) {
        transaction.removeMark(range.$from.pos, range.$to.pos, mark);
      }

      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

function createSelectLinkCommand(mark: MarkType): QalmaCommandHandler {
  return (state, dispatch, view, value) => {
    const range = resolveLinkSelectionRange(state, mark, view, value);

    if (!range) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .setSelection(TextSelection.create(state.doc, range.from, range.to))
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function createLinkClickPlugin(
  options: Readonly<LinkPluginOptions>,
  onClick: LinkClickHandler,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleDOMEvents: {
        click: (_view, event) => {
          const link = findClickedLink(event.target);

          if (!link) {
            return false;
          }

          const href = normalizeHref(link.getAttribute('href'), options);

          if (!href) {
            return false;
          }

          event.preventDefault();

          const target =
            normalizeTarget(link.getAttribute('target')) ??
            options.defaultTarget;
          const rel =
            normalizeRel(link.getAttribute('rel')) ?? options.defaultRel;

          onClick({
            event,
            element: link,
            href,
            target,
            rel,
            text: link.textContent ?? '',
          });

          return true;
        },
      },
    },
  });
}

function findClickedLink(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Node)) {
    return null;
  }

  const element = target instanceof Element ? target : target.parentElement;

  if (!element) {
    return null;
  }

  const link = element.closest<HTMLAnchorElement>('a[href]');

  return link instanceof HTMLAnchorElement ? link : null;
}

function resolveLinkSelectionRange(
  state: EditorState,
  mark: MarkType,
  view: EditorView | undefined,
  value: unknown,
): LinkRangeTarget | null {
  if (isLinkRangeTarget(value)) {
    return hasLinkBetween(state, mark, value.from, value.to) ? value : null;
  }

  if (isLinkElementTarget(value) && view) {
    const position = getElementDocumentPosition(view, value.element);

    if (position === null) {
      return null;
    }

    const range = findLinkRange(state.doc.resolve(position), mark);

    return range ? { from: range.from, to: range.to } : null;
  }

  const stateValue = getLinkState(state, mark);

  return stateValue
    ? {
        from: stateValue.from,
        to: stateValue.to,
      }
    : null;
}

function getElementDocumentPosition(
  view: EditorView,
  element: HTMLAnchorElement,
): number | null {
  try {
    return view.posAtDOM(element.firstChild ?? element, 0);
  } catch {
    return null;
  }
}

function getLinkState(state: EditorState, mark: MarkType): LinkState | null {
  if (state.selection.empty) {
    const range = findLinkRange(state.selection.$from, mark);

    return range ? createLinkState(state, range) : null;
  }

  let found: LinkRange | null = null;

  state.doc.nodesBetween(
    state.selection.from,
    state.selection.to,
    (_node, pos) => {
      if (found) {
        return false;
      }

      const range = findLinkRange(state.doc.resolve(pos), mark);

      if (range) {
        found = range;

        return false;
      }

      return undefined;
    },
  );

  return found ? createLinkState(state, found) : null;
}

interface LinkRange {
  from: number;
  to: number;
  mark: Mark;
}

function findLinkRange(
  $position: ResolvedPos,
  mark: MarkType,
): LinkRange | null {
  const parent = $position.parent;
  const after = parent.childAfter($position.parentOffset);
  const before = parent.childBefore($position.parentOffset);
  const current = mark.isInSet(after.node?.marks ?? []);
  const previous = mark.isInSet(before.node?.marks ?? []);
  const link = current ?? previous;

  if (!link) {
    return null;
  }

  let startIndex = current ? after.index : before.index;
  let endIndex = startIndex + 1;
  let from = $position.start() + (current ? after.offset : before.offset);
  let to =
    from +
    (current ? (after.node?.nodeSize ?? 0) : (before.node?.nodeSize ?? 0));

  while (
    startIndex > 0 &&
    hasSameMark(parent.child(startIndex - 1).marks, link)
  ) {
    startIndex -= 1;
    from -= parent.child(startIndex).nodeSize;
  }

  while (
    endIndex < parent.childCount &&
    hasSameMark(parent.child(endIndex).marks, link)
  ) {
    to += parent.child(endIndex).nodeSize;
    endIndex += 1;
  }

  return {
    from,
    to,
    mark: link,
  };
}

function hasSameMark(marks: readonly Mark[], mark: Mark): boolean {
  return marks.some((candidate) => candidate.eq(mark));
}

function createLinkState(state: EditorState, range: LinkRange): LinkState {
  return {
    from: range.from,
    to: range.to,
    href: range.mark.attrs['href'],
    target: normalizeTarget(range.mark.attrs['target']),
    rel: normalizeRel(range.mark.attrs['rel']),
    text: state.doc.textBetween(range.from, range.to, ''),
  };
}

function resolveLinkAttrs(
  value: unknown,
  options: Readonly<LinkPluginOptions>,
): LinkCommandValue | null {
  const rawValue =
    typeof value === 'string'
      ? { href: value }
      : isLinkCommandValue(value)
        ? value
        : null;

  if (!rawValue) {
    return null;
  }

  const href = normalizeHref(rawValue.href, options);

  if (!href) {
    return null;
  }

  return {
    href,
    target: normalizeTarget(rawValue.target ?? options.defaultTarget),
    rel: normalizeRel(rawValue.rel ?? options.defaultRel),
  };
}

function normalizeHref(
  value: string | null | undefined,
  options: Readonly<LinkPluginOptions>,
): string | null {
  const href = value?.trim();

  if (!href) {
    return null;
  }

  const protocol = href.match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();

  if (!protocol) {
    return options.allowRelativeLinks ? href : null;
  }

  return options.allowedProtocols.includes(protocol) ? href : null;
}

function normalizeTarget(value: unknown): '_blank' | null {
  return value === '_blank' ? value : null;
}

function normalizeRel(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim() || null;
}

function isLinkCommandValue(value: unknown): value is LinkCommandValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'href' in value &&
    typeof value.href === 'string'
  );
}

function isLinkElementTarget(value: unknown): value is LinkElementTarget {
  return (
    typeof value === 'object' &&
    value !== null &&
    'element' in value &&
    value.element instanceof HTMLAnchorElement
  );
}

function isLinkRangeTarget(value: unknown): value is LinkRangeTarget {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    'to' in value &&
    typeof value.from === 'number' &&
    typeof value.to === 'number'
  );
}

function hasLinkBetween(
  state: EditorState,
  mark: MarkType,
  from: number,
  to: number,
): boolean {
  if (from < 0 || to > state.doc.content.size || from >= to) {
    return false;
  }

  return state.doc.rangeHasMark(from, to, mark);
}

function selectionAllowsMark(state: EditorState, mark: MarkType): boolean {
  if (state.selection.empty) {
    return state.selection.$from.parent.type.allowsMarkType(mark);
  }

  return state.selection.ranges.some((range) => {
    let allowsMark = false;

    state.doc.nodesBetween(
      range.$from.pos,
      range.$to.pos,
      (node, _pos, parent) => {
        if (allowsMark) {
          return false;
        }

        if (node.isInline && parent?.type.allowsMarkType(mark)) {
          allowsMark = true;

          return false;
        }

        return undefined;
      },
    );

    return allowsMark;
  });
}

function assertLinkPluginOptions(options: Readonly<LinkPluginOptions>): void {
  if (!Array.isArray(options.allowedProtocols)) {
    throw new TypeError('LinkPlugin allowedProtocols must be an array.');
  }

  if (options.allowedProtocols.length === 0) {
    throw new RangeError(
      'LinkPlugin allowedProtocols must include at least one protocol.',
    );
  }

  for (const protocol of options.allowedProtocols) {
    if (typeof protocol !== 'string' || !/^[a-z][a-z0-9+.-]*$/.test(protocol)) {
      throw new TypeError(
        'LinkPlugin allowedProtocols entries must be protocol names without colons.',
      );
    }
  }

  if (typeof options.allowRelativeLinks !== 'boolean') {
    throw new TypeError('LinkPlugin allowRelativeLinks must be a boolean.');
  }

  if (options.defaultTarget !== null && options.defaultTarget !== '_blank') {
    throw new TypeError('LinkPlugin defaultTarget must be "_blank" or null.');
  }

  if (
    options.defaultRel !== null &&
    (typeof options.defaultRel !== 'string' || options.defaultRel.trim() === '')
  ) {
    throw new TypeError(
      'LinkPlugin defaultRel must be a non-empty string or null.',
    );
  }

  if (options.onClick !== null && typeof options.onClick !== 'function') {
    throw new TypeError('LinkPlugin onClick must be a function or null.');
  }
}
