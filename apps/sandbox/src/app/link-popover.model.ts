export interface LinkPopover extends LinkPopoverPlacement {
  editing: boolean;
  element: HTMLAnchorElement | null;
  href: string;
  rel: string | null;
  target: '_blank' | null;
  text: string;
}

export interface LinkPopoverPlacement {
  left: number;
  top: number;
}

export function createLinkPopoverPlacement(
  element: HTMLElement,
): LinkPopoverPlacement {
  const rect = element.getBoundingClientRect();
  const width = 360;
  const leftBoundary = Math.max(16, window.innerWidth - width - 16);

  return {
    left: Math.min(Math.max(rect.left, 16), leftBoundary),
    top: rect.bottom + 8,
  };
}

export function findEditorLinkElement(
  target: EventTarget | null,
): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const element = target.closest<HTMLAnchorElement>('.ProseMirror a[href]');

  return element instanceof HTMLAnchorElement ? element : null;
}
