import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';

/**
 * Progressive enhancement for markdown-rendered docs content. The content is
 * static HTML produced by the AnalogJS markdown pipeline, so interactive
 * Angular components can't live inside it — instead this directive rewrites the
 * rendered DOM after hydration:
 *
 * - Runs of adjacent package-manager command blocks (`npm`/`pnpm`/`yarn`/`bun`)
 *   become a single tabbed "terminal" card, shadcn-style.
 * - Every other `<pre>` gets a copy button revealed on hover.
 *
 * A `MutationObserver` re-applies the enhancement when the router swaps the
 * page content. All work is idempotent (processed nodes are marked).
 */
@Directive({
  selector: '[docsContent]',
})
export class DocsContent {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private observer?: MutationObserver;
  private enhancing = false;

  constructor() {
    afterNextRender(() => {
      this.enhance();

      this.observer = new MutationObserver(() => {
        if (!this.enhancing) {
          this.enhance();
        }
      });
      this.observer.observe(this.host.nativeElement, {
        childList: true,
        subtree: true,
      });
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  private enhance(): void {
    this.enhancing = true;
    try {
      this.buildPackageManagerCards();
      this.addCopyButtons();
    } finally {
      this.enhancing = false;
    }
  }

  /**
   * Collapses each run of two or more consecutive package-manager command
   * blocks into one tabbed card.
   */
  private buildPackageManagerCards(): void {
    const pres = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLPreElement>(
        'pre:not([data-enhanced])',
      ),
    );

    let index = 0;
    while (index < pres.length) {
      const start = pres[index];
      const manager = detectPackageManager(start);

      if (!manager) {
        index += 1;
        continue;
      }

      // Gather the adjacent sibling <pre> blocks that are also PM commands.
      const run: { pre: HTMLPreElement; manager: string }[] = [
        { pre: start, manager },
      ];
      let next = index + 1;
      while (next < pres.length) {
        const candidate = pres[next];
        const candidateManager = detectPackageManager(candidate);
        const last = run[run.length - 1].pre;
        if (!candidateManager || !areAdjacentSiblings(last, candidate)) {
          break;
        }
        run.push({ pre: candidate, manager: candidateManager });
        next += 1;
      }

      if (run.length >= 2) {
        this.renderPackageManagerCard(run);
        index = next;
      } else {
        index += 1;
      }
    }
  }

  private renderPackageManagerCard(
    run: { pre: HTMLPreElement; manager: string }[],
  ): void {
    // Canonical tab order, restricted to the managers actually present.
    const order = ['pnpm', 'npm', 'yarn', 'bun'];
    const ordered = order
      .map((manager) => run.find((entry) => entry.manager === manager))
      .filter((entry): entry is { pre: HTMLPreElement; manager: string } =>
        Boolean(entry),
      );
    const tabs = ordered.length ? ordered : run;

    // Mark the original location before the panels get moved into the card.
    const anchor = document.createComment('docs-pm');
    run[0].pre.before(anchor);

    const card = document.createElement('div');
    card.className = 'docs-pm';
    card.setAttribute('data-enhanced', '');

    const head = document.createElement('div');
    head.className = 'docs-pm-head';
    head.innerHTML = `<span class="docs-pm-glyph" aria-hidden="true">${TERMINAL_SVG}</span>`;

    const tablist = document.createElement('div');
    tablist.className = 'docs-pm-tabs';
    tablist.setAttribute('role', 'tablist');

    const body = document.createElement('div');
    body.className = 'docs-pm-body';

    tabs.forEach((entry, tabIndex) => {
      const active = tabIndex === 0;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'docs-pm-tab';
      tab.textContent = entry.manager;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(active));
      if (active) {
        tab.classList.add('is-active');
      }

      const panel = entry.pre;
      panel.setAttribute('data-enhanced', '');
      panel.classList.add('docs-pm-panel');
      panel.hidden = !active;

      tab.addEventListener('click', () => {
        tablist.querySelectorAll('.docs-pm-tab').forEach((node) => {
          node.classList.remove('is-active');
          node.setAttribute('aria-selected', 'false');
        });
        body.querySelectorAll('pre').forEach((node) => {
          (node as HTMLPreElement).hidden = true;
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        panel.hidden = false;
      });

      tablist.appendChild(tab);
      body.appendChild(panel);
    });

    const copy = createCopyButton(() => {
      const visible = body.querySelector<HTMLPreElement>('pre:not([hidden])');
      return visible?.innerText ?? '';
    });
    copy.classList.add('docs-pm-copy');

    head.appendChild(tablist);
    head.appendChild(copy);
    card.appendChild(head);
    card.appendChild(body);

    anchor.replaceWith(card);
  }

  /** Adds a hover-revealed copy button to every remaining code block. */
  private addCopyButtons(): void {
    const pres = this.host.nativeElement.querySelectorAll<HTMLPreElement>(
      'pre:not([data-enhanced])',
    );

    pres.forEach((pre) => {
      pre.setAttribute('data-enhanced', '');

      const wrapper = document.createElement('div');
      wrapper.className = 'docs-code';
      pre.before(wrapper);
      wrapper.appendChild(pre);

      const copy = createCopyButton(() => pre.innerText);
      copy.classList.add('docs-code-copy');
      wrapper.appendChild(copy);
    });
  }
}

const PACKAGE_MANAGERS: Record<string, string> = {
  npm: 'npm',
  npx: 'npm',
  pnpm: 'pnpm',
  pnpx: 'pnpm',
  yarn: 'yarn',
  bun: 'bun',
  bunx: 'bun',
};

function detectPackageManager(pre: HTMLPreElement): string | null {
  const firstToken = (pre.textContent ?? '').trim().split(/\s+/)[0] ?? '';
  return PACKAGE_MANAGERS[firstToken] ?? null;
}

function areAdjacentSiblings(a: Element, b: Element): boolean {
  let node: Node | null = a.nextSibling;
  while (node) {
    if (node === b) {
      return true;
    }
    // Allow only whitespace text nodes between the two <pre> elements.
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      node = node.nextSibling;
      continue;
    }
    return false;
  }
  return false;
}

function createCopyButton(getText: () => string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'docs-copy';
  button.setAttribute('aria-label', 'Copy to clipboard');
  button.innerHTML = `<span class="docs-copy-idle" aria-hidden="true">${COPY_SVG}</span><span class="docs-copy-done" aria-hidden="true">${CHECK_SVG}</span>`;

  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  button.addEventListener('click', async () => {
    const text = getText().replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    button.classList.add('is-copied');
    button.setAttribute('aria-label', 'Copied');
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      button.classList.remove('is-copied');
      button.setAttribute('aria-label', 'Copy to clipboard');
    }, 1600);
  });

  return button;
}

const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const TERMINAL_SVG = `<svg ${SVG_ATTRS}><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>`;
const COPY_SVG = `<svg ${SVG_ATTRS}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg ${SVG_ATTRS}><path d="M20 6 9 17l-5-5"/></svg>`;
