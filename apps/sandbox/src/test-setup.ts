import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-serializers';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { expect } from 'vitest';

setupTestBed();

unwrapNgIconCssLayerForJsdom();

function unwrapNgIconCssLayerForJsdom(): void {
  const originalAppendChild = HTMLHeadElement.prototype.appendChild;

  HTMLHeadElement.prototype.appendChild = function appendChild<T extends Node>(
    node: T,
  ): T {
    unwrapNgIconStyle(node);

    return originalAppendChild.call(this, node) as T;
  };
}

function unwrapNgIconStyle(node: Node): void {
  if (!(node instanceof HTMLStyleElement)) {
    return;
  }

  const style = node.textContent;

  if (!style?.includes('@layer ng-icon')) {
    return;
  }

  node.textContent = style.replace(
    /@layer\s+ng-icon\s*\{([\s\S]*)\}\s*$/,
    '$1',
  );
}

expect.extend({
  toBeTrue(received: unknown) {
    return {
      pass: received === true,
      message: () => `expected ${String(received)} to be true`,
    };
  },
  toBeFalse(received: unknown) {
    return {
      pass: received === false,
      message: () => `expected ${String(received)} to be false`,
    };
  },
});

declare module 'vitest' {
  // Vitest declares Assertion<T = any>; module augmentation must match it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toBeTrue(): void;
    toBeFalse(): void;
  }

  interface AsymmetricMatchersContaining {
    toBeTrue(): unknown;
    toBeFalse(): unknown;
  }
}
