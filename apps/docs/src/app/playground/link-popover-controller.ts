import { signal } from '@angular/core';
import { LinkState, QalmaEditorController } from '@qalma/editor';

import {
  createLinkPopoverPlacement,
  findEditorLinkElement,
  LinkPopover,
} from './link-popover.model';

export class LinkPopoverController {
  readonly popover = signal<LinkPopover | null>(null);
  readonly href = signal('');

  private hideTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly editor: QalmaEditorController) {}

  showToolbarEditor(event: MouseEvent): void {
    const linkState = this.editor.query<LinkState>('link');
    const target = event.currentTarget;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.keepOpen();
    this.href.set(linkState?.href ?? 'https://');
    this.popover.set({
      ...createLinkPopoverPlacement(target),
      editing: true,
      element: null,
      href: linkState?.href ?? '',
      rel: linkState?.rel ?? null,
      target: linkState?.target ?? null,
      text: linkState?.text ?? '',
    });
  }

  showPreview(event: Event): void {
    const element = findEditorLinkElement(event.target);

    if (!element) {
      return;
    }

    this.keepOpen();
    this.popover.set({
      ...createLinkPopoverPlacement(element),
      editing: false,
      element,
      href: element.href,
      rel: element.rel || null,
      target: element.target === '_blank' ? '_blank' : null,
      text: element.textContent?.trim() ?? '',
    });
  }

  scheduleHideFromEvent(event: MouseEvent | FocusEvent): void {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Element &&
      (findEditorLinkElement(nextTarget) ||
        nextTarget.closest('[data-link-popover]'))
    ) {
      return;
    }

    if (!this.popover()?.editing) {
      this.scheduleHide();
    }
  }

  edit(popover: LinkPopover): void {
    this.keepOpen();
    this.selectLink(popover);
    this.href.set(popover.href);
    this.popover.set({
      ...popover,
      editing: true,
    });
  }

  save(popover: LinkPopover): void {
    const href = this.href().trim();

    if (!href) {
      return;
    }

    this.selectLink(popover);
    this.editor.execute('setLink', href);
    this.hide();
  }

  remove(popover: LinkPopover): void {
    this.selectLink(popover);
    this.editor.execute('unsetLink');
    this.hide();
  }

  hide(): void {
    this.clearHideTimeout();
    this.popover.set(null);
  }

  keepOpen(): void {
    this.clearHideTimeout();
  }

  scheduleHide(): void {
    this.clearHideTimeout();

    if (this.popover()?.editing) {
      return;
    }

    this.hideTimeout = setTimeout(() => {
      if (this.popover()?.editing) {
        this.hideTimeout = undefined;

        return;
      }

      this.popover.set(null);
      this.hideTimeout = undefined;
    }, 160);
  }

  private selectLink(popover: LinkPopover): void {
    if (popover.element) {
      this.editor.execute('selectLink', {
        element: popover.element,
      });
    }
  }

  private clearHideTimeout(): void {
    if (!this.hideTimeout) {
      return;
    }

    clearTimeout(this.hideTimeout);
    this.hideTimeout = undefined;
  }
}
