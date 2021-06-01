goog.module('os.capture.gif');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');

/**
 * Path to the worker script used by the GIF library.
 * @type {string}
 */
const WORKER_SCRIPT = ROOT + 'vendor/gif/gif.worker.js';

exports = {
  WORKER_SCRIPT
};
