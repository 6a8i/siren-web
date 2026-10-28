// Polyfills for the browsers in package.json's browserslist (Chrome 55, Firefox 52, Safari 10.1,
// iOS 10.3, Edge 15, Opera 42, Samsung 6). Each one names the browser that still needs it; the
// decision table is in docs/browser-support.md.

// Built-ins newer than ES2017: Promise.prototype.finally (Chrome 63, Firefox 58, Safari 11.1,
// Edge 18), Object.fromEntries (Chrome 73, Firefox 63, Safari 12.1), Array.prototype.flat
// (Chrome 69, Firefox 62, Safari 12), String.prototype.matchAll (Chrome 73, Firefox 67, Safari 13).
// Babel's useBuiltIns: 'usage' only covers the files it compiles; the TypeScript sources come out
// of ts-loader and the packages outside the Babel include list are untouched, so they rely on this.
import 'core-js/stable';
import 'jquery';
// TextEncoder/TextDecoder: EdgeHTML never had them (Edge 15 to 18; Chromium Edge 79 does).
import 'fast-text-encoding';
// IntersectionObserver: Firefox 55, Safari 12.1 (iOS 12.2), Chrome 58, Edge 16, Opera 45, Samsung 7.2.
import 'intersection-observer';
// DOMTokenList.replace() (components/slideshow): Chrome 61, Edge 17, Opera 48, Samsung 8.
import 'classlist.js';
// AbortController and the signal on fetch: Chrome 66, Firefox 57, Safari 12.1 (iOS 12.2), Edge 16,
// Opera 53, Samsung 9.2. Patches the native fetch, which every target has (Safari 10.1, Edge 14).
import 'abortcontroller-polyfill';
// ResizeObserver: Chrome 64, Firefox 69, Safari 13.1 (iOS 13.4), Edge 79, Opera 52, Samsung 9.2.
import 'resize-observer-polyfill';

import './domParserTextHtml';
import './elementAppendPrepend';
import './focusPreventScroll';
import './htmlMediaElement';
import './keyboardEvent';
import './mediaQueryList';
import './patchHeaders';
import './vendorStyles';
