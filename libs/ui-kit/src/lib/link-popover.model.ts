import { anchorToRect } from './anchor-to-rect';

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

const LINK_POPOVER_WIDTH = 360;
// Both the editing and preview rows are a single h-9 (36px) control plus
// padding/border; this is an estimate since the actual element isn't
// rendered yet when the placement is computed.
const LINK_POPOVER_HEIGHT_ESTIMATE = 56;

export function createLinkPopoverPlacement(
  element: HTMLElement,
): LinkPopoverPlacement {
  const rect = element.getBoundingClientRect();

  return anchorToRect(rect, {
    placement: 'bottom',
    boundary: {
      top: 0,
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth,
    },
    size: { width: LINK_POPOVER_WIDTH, height: LINK_POPOVER_HEIGHT_ESTIMATE },
    gap: 8,
    edgeMargin: 16,
    align: 'start',
  });
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
