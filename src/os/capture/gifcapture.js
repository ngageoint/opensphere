goog.declareModuleId('os.capture.gif');

const {ROOT} = goog.require('os');


/**
 * Path to the worker script used by the GIF library.
 * @type {string}
 */
export const WORKER_SCRIPT = ROOT + 'vendor/gif/gif.worker.js';
