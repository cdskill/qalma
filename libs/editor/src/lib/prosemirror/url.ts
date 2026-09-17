export interface QalmaUrlPolicy {
  readonly allowedProtocols: readonly string[];
  readonly allowRelative: boolean;
}

const EXPLICIT_PROTOCOL = /^([a-z][a-z0-9+.-]*):/i;
const NETWORK_PATH_REFERENCE = /^[\\/]{2}/;
const EXECUTABLE_PROTOCOLS = new Set([
  'blob',
  'data',
  'javascript',
  'vbscript',
]);

/**
 * Normalize a URL-like attribute without asking the browser to resolve it.
 *
 * Browsers discard ASCII tabs and newlines while parsing URL schemes, so a
 * value such as `java\nscript:` must be rejected before a simple scheme regex
 * can mistake it for a relative URL. Protocol-relative references are also
 * rejected: they are external URLs, not relative paths, and would otherwise
 * bypass the protocol allowlist.
 */
export function normalizeQalmaUrl(
  value: unknown,
  policy: Readonly<QalmaUrlPolicy>,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const url = value.trim();

  if (
    !url ||
    hasAsciiControlCharacters(url) ||
    NETWORK_PATH_REFERENCE.test(url)
  ) {
    return null;
  }

  const protocol = url.match(EXPLICIT_PROTOCOL)?.[1].toLowerCase();

  if (!protocol) {
    return policy.allowRelative ? url : null;
  }

  if (EXECUTABLE_PROTOCOLS.has(protocol)) {
    return null;
  }

  return policy.allowedProtocols.includes(protocol) ? url : null;
}

function hasAsciiControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);

    return code <= 0x1f || code === 0x7f;
  });
}

export function assertQalmaUrlAttribute(
  value: unknown,
  policy: Readonly<QalmaUrlPolicy>,
  attributeName: string,
): void {
  if (normalizeQalmaUrl(value, policy) !== value) {
    throw new RangeError(`Invalid ${attributeName} URL.`);
  }
}
