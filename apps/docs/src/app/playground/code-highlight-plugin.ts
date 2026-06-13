import { createQalmaPlugin } from '@qalma/editor';
import { lucideCheck, lucideCopy, lucideTextSelect } from '@ng-icons/lucide';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import { createLowlight } from 'lowlight';
import { Node as ProseMirrorNode, NodeType } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state';
import {
  Decoration,
  DecorationSet,
  type NodeView,
  type ViewMutationRecord,
} from 'prosemirror-view';

import { PLAYGROUND_CODE_BLOCK_LANGUAGES } from './code-block';

const lowlight = createLowlight({
  csharp,
  go,
  javascript,
  typescript,
});

const codeHighlightKey = new PluginKey<DecorationSet>('playgroundCodeHighlight');

export const PlaygroundCodeHighlightPlugin = createQalmaPlugin({
  key: 'playgroundCodeHighlight',
  prosemirrorPlugins: (schema) => {
    const codeBlock = schema.nodes['codeBlock'];

    return codeBlock ? [createCodeHighlightPlugin(codeBlock)] : [];
  },
});

function createCodeHighlightPlugin(codeBlock: NodeType): ProseMirrorPlugin {
  return new ProseMirrorPlugin<DecorationSet>({
    key: codeHighlightKey,
    state: {
      init: (_, state) => createCodeHighlightDecorations(state, codeBlock),
      apply: (transaction, decorations, _oldState, state) =>
        shouldRebuildDecorations(transaction)
          ? createCodeHighlightDecorations(state, codeBlock)
          : decorations.map(transaction.mapping, transaction.doc),
    },
    props: {
      decorations: (state) => codeHighlightKey.getState(state),
      nodeViews: {
        codeBlock: (node) => new PlaygroundCodeBlockView(node),
      },
    },
  });
}

function shouldRebuildDecorations(transaction: Transaction): boolean {
  return transaction.docChanged;
}

function createCodeHighlightDecorations(
  state: EditorState,
  codeBlock: NodeType,
): DecorationSet {
  const decorations: Decoration[] = [];

  state.doc.descendants((node, position) => {
    if (node.type !== codeBlock) {
      return;
    }

    decorations.push(...highlightCodeBlock(node, position));
  });

  return DecorationSet.create(state.doc, decorations);
}

function highlightCodeBlock(
  node: ProseMirrorNode,
  position: number,
): Decoration[] {
  const language = getCodeBlockLanguage(node);

  if (!language || language === 'plaintext' || !lowlight.registered(language)) {
    return [];
  }

  const tree = lowlight.highlight(language, node.textContent);

  return collectHighlightDecorations(tree.children, position + 1);
}

function getCodeBlockLanguage(node: ProseMirrorNode): string | null {
  const language = node.attrs['language'];

  return typeof language === 'string' ? language : null;
}

class PlaygroundCodeBlockView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;

  private readonly languageLabel: HTMLElement;
  private readonly copyButton: HTMLButtonElement;
  private readonly copyIcon: HTMLElement;
  private readonly copyLabel: HTMLElement;
  private readonly code: HTMLElement;
  private copyResetTimer: number | null = null;
  private node: ProseMirrorNode;

  constructor(node: ProseMirrorNode) {
    this.node = node;
    this.dom = document.createElement('div');
    this.dom.className = 'qalma-code-block';

    const toolbar = document.createElement('div');
    toolbar.className = 'qalma-code-block-toolbar';
    toolbar.contentEditable = 'false';

    this.languageLabel = document.createElement('span');
    this.languageLabel.className = 'qalma-code-block-language';

    this.copyButton = document.createElement('button');
    this.copyButton.className = 'qalma-code-block-copy';
    this.copyButton.type = 'button';
    this.copyIcon = document.createElement('span');
    this.copyIcon.className = 'qalma-code-block-copy-icon';
    this.copyLabel = document.createElement('span');
    this.copyLabel.className = 'qalma-code-block-copy-label';
    this.copyButton.append(this.copyIcon, this.copyLabel);
    this.copyButton.addEventListener('click', () => {
      void this.copyCode();
    });

    toolbar.append(this.languageLabel, this.copyButton);

    const pre = document.createElement('pre');
    this.code = document.createElement('code');
    this.contentDOM = this.code;
    pre.append(this.code);

    this.dom.append(toolbar, pre);
    this.updateNodeChrome();
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.updateNodeChrome();

    return true;
  }

  stopEvent(event: Event): boolean {
    return this.copyButton.contains(event.target as Node | null);
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    return !this.contentDOM.contains(mutation.target);
  }

  destroy(): void {
    if (this.copyResetTimer !== null) {
      window.clearTimeout(this.copyResetTimer);
    }
  }

  private updateNodeChrome(): void {
    const language = getCodeBlockLanguage(this.node) ?? 'plaintext';
    const languageLabel = getLanguageLabel(language);

    this.dom.dataset['language'] = language;
    this.code.className = `language-${language}`;
    this.languageLabel.textContent = languageLabel;
    this.copyIcon.innerHTML = lucideCopy;
    this.copyLabel.textContent = 'Copy';
    this.copyButton.setAttribute('aria-label', `Copy ${languageLabel} code`);
  }

  private async copyCode(): Promise<void> {
    try {
      await writeClipboardText(this.node.textContent);
      this.showCopyState('Copied', 'true', lucideCheck);
    } catch {
      this.selectCode();
      this.showCopyState('Selected', 'fallback', lucideTextSelect);
    }
  }

  private showCopyState(
    label: string,
    copied: 'true' | 'fallback',
    icon: string,
  ): void {
    this.copyIcon.innerHTML = icon;
    this.copyLabel.textContent = label;
    this.copyButton.dataset['copied'] = copied;

    if (this.copyResetTimer !== null) {
      window.clearTimeout(this.copyResetTimer);
    }

    this.copyResetTimer = window.setTimeout(() => {
      this.copyIcon.innerHTML = lucideCopy;
      this.copyLabel.textContent = 'Copy';
      delete this.copyButton.dataset['copied'];
      this.copyResetTimer = null;
    }, 1400);
  }

  private selectCode(): void {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(this.contentDOM);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

async function writeClipboardText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);

      return;
    } catch {
      // Fall through to the textarea copy strategy for restricted runtimes.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy command was rejected.');
    }
  } finally {
    textarea.remove();
  }
}

function getLanguageLabel(language: string): string {
  return (
    PLAYGROUND_CODE_BLOCK_LANGUAGES.find((entry) => entry.value === language)
      ?.label ?? language
  );
}

interface HighlightElement {
  type: 'element';
  properties?: {
    className?: unknown;
  };
  children?: unknown[];
}

interface HighlightText {
  type: 'text';
  value: string;
}

interface HighlightRange {
  decorations: Decoration[];
  offset: number;
}

function collectHighlightDecorations(
  nodes: readonly unknown[],
  start: number,
): Decoration[] {
  let offset = 0;
  const decorations: Decoration[] = [];

  for (const node of nodes) {
    const range = collectHighlightRange(node, start + offset);

    decorations.push(...range.decorations);
    offset += range.offset;
  }

  return decorations;
}

function collectHighlightRange(node: unknown, start: number): HighlightRange {
  if (isHighlightText(node)) {
    return {
      decorations: [],
      offset: node.value.length,
    };
  }

  if (!isHighlightElement(node)) {
    return {
      decorations: [],
      offset: 0,
    };
  }

  let offset = 0;
  const decorations: Decoration[] = [];

  for (const child of node.children ?? []) {
    const range = collectHighlightRange(child, start + offset);

    decorations.push(...range.decorations);
    offset += range.offset;
  }

  const className = getHighlightClassName(node);

  if (className && offset > 0) {
    decorations.unshift(
      Decoration.inline(start, start + offset, {
        class: className,
      }),
    );
  }

  return {
    decorations,
    offset,
  };
}

function isHighlightElement(node: unknown): node is HighlightElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'element'
  );
}

function isHighlightText(node: unknown): node is HighlightText {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'text' &&
    'value' in node &&
    typeof node.value === 'string'
  );
}

function getHighlightClassName(node: HighlightElement): string | null {
  const className = node.properties?.className;

  if (!Array.isArray(className)) {
    return null;
  }

  const classes = className.filter(
    (value): value is string =>
      typeof value === 'string' && value.startsWith('hljs-'),
  );

  return classes.length > 0 ? classes.join(' ') : null;
}
