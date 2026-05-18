/**
 * Node 18 lacks global File (undici/cheerio need it). No-op on Node 20+.
 *
 * AI-GENERATED (Cursor)
 */
'use strict';

if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  globalThis.File = class File extends Blob {
    constructor(bits, name, options = {}) {
      super(bits, options);
      this.name = String(name);
      this.lastModified = options.lastModified ?? Date.now();
    }
  };
}
