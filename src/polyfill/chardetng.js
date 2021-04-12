goog.module('polyfill.chardetng');

const TrustedResourceUrl = goog.require('goog.html.TrustedResourceUrl');
const {createConstant} = goog.require('os.string');
const {safeLoad} = goog.require('goog.net.jsloader');
const os = goog.require('os');

/**
 * @define {string} Base path to the jschardet library from the OpenSphere root.
 */
const JSCHARDET_BASE_PATH = goog.define('JSCHARDET_BASE_PATH', 'vendor/jschardet');

if (!window.WebAssembly) {
  // Web Assembly is not supported, so polyfill chardetng.detect()
  // with jschardet.
  window.chardetng = window.chardetng || {};

  // load jschardet only if needed
  if (window.jschardet === undefined) {
    const path = os.ROOT + JSCHARDET_BASE_PATH + '/jschardet.min.js';
    const trustedUrl = TrustedResourceUrl.fromConstant(createConstant(path));
    safeLoad(trustedUrl);
  }

  // polyfill
  window.chardetng.detect = (uint8Array) => {
    // I'm aware this looks dumb and doubles the memory, but jschardet lacks the ability
    // to take a typed array as input.
    let binaryString = '';
    // Don't send jschardet more than 16KB of data. It is pretty sluggish on large files
    const max = Math.min(uint8Array.length, 16 * 1024);
    for (let i = 0; i < max; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }

    return jschardet.detect(binaryString).encoding;
  };
}
