import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PosthogService } from '../services/posthog.service';
import { PagefindSearch } from '../search/pagefind-search';
import { DocsSearch } from './docs-search';

describe('DocsSearch', () => {
  const pagefind = {
    warm: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([
      {
        id: 'commands-0',
        url: '/docs/commands#registry',
        pageTitle: 'Commands',
        sectionTitle: 'Command registry',
        section: 'Docs' as const,
        excerpt: 'Typed <mark>commands</mark>.',
      },
    ]),
  };
  const capture = vi.fn();

  beforeEach(() => {
    pagefind.warm.mockClear();
    pagefind.search.mockClear();
    capture.mockClear();

    HTMLDialogElement.prototype.showModal = function showModal(): void {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(): void {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };

    TestBed.configureTestingModule({
      imports: [DocsSearch],
      providers: [
        provideRouter([]),
        { provide: PagefindSearch, useValue: pagefind },
        {
          provide: PosthogService,
          useValue: { posthog: { capture } },
        },
      ],
    });
  });

  it('opens from the trigger and searches after two characters', async () => {
    const fixture = TestBed.createComponent(DocsSearch);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector<HTMLButtonElement>('button');

    trigger?.click();
    await fixture.whenStable();

    expect(host.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(pagefind.warm).toHaveBeenCalledOnce();

    const input = host.querySelector<HTMLInputElement>(
      'input[inputmode="search"]',
    );
    if (!input) {
      throw new Error('Expected the docs search input.');
    }

    input.value = 'commands';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.waitFor(() => {
      expect(pagefind.search).toHaveBeenCalledWith('commands');
      expect(host.textContent).toContain('Command registry');
    });
  });

  it('opens with the platform shortcut and closes with Escape', async () => {
    const fixture = TestBed.createComponent(DocsSearch);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    );
    await fixture.whenStable();

    const dialog = host.querySelector<HTMLDialogElement>('dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);

    dialog?.close();
    await fixture.whenStable();

    expect(dialog?.hasAttribute('open')).toBe(false);
    expect(host.querySelector('button')).toBe(document.activeElement);
  });
});
