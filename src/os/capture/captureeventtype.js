goog.declareModuleId('os.capture.CaptureEventType');

/**
 * Capture event types.
 * @enum {string}
 */
export default {
  STATUS: 'capture:status',
  UNBLOCK: 'capture:unblock',
  PROGRESS: 'capture:progress',
  COMPLETE: 'capture:complete',
  ERROR: 'capture:error'
};
