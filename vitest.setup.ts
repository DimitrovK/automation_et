import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship a ResizeObserver, but `cmdk` (used by the
// shadcn Command/Popover combobox) requires it. Provide a no-op
// polyfill so combobox-based components can be unit-tested.
if (typeof globalThis.ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// `Element.prototype.scrollIntoView` is missing in jsdom — cmdk keeps
// the active item in view by calling it. No-op is fine in tests.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

// Radix Popover's outside-click detection touches pointer-capture
// methods that jsdom doesn't implement.
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).hasPointerCapture = function () { return false; };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).releasePointerCapture = function () {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).setPointerCapture = function () {};
}
