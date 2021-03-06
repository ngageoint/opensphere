goog.module('os.capture.CaptureEventType');
goog.module.declareLegacyNamespace();

/**
 * Capture event types.
 * @enum {string}
 */
exports = {
  STATUS: 'capture:status',
  UNBLOCK: 'capture:unblock',
  PROGRESS: 'capture:progress',
  COMPLETE: 'capture:complete',
  ERROR: 'capture:error'
};
