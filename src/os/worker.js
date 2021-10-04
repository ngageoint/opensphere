goog.declareModuleId('os.worker');

/**
 * @define {string} The path to os workers.
 *
 * Override this in compiled mode using --define os.worker.DIR='something/else', or to override in uncompiled mode
 * use:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'os.worker.DIR': 'something/else'};
 * </pre>
 *
 * Note the above must be executed prior to loading base.js.
 */
export const DIR = goog.define('os.worker.DIR', 'src/worker/');
