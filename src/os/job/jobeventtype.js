goog.module('os.job.JobEventType');
goog.module.declareLegacyNamespace();

/**
 * Job events indicating when data is ready from the Worker, or an error
 * occurred.
 *
 * @enum {string}
 */
exports = {
  COMPLETE: 'job:complete',
  DATAREADY: 'job:dataready',
  CHANGE: 'job:change',
  ERROR: 'job:error'
};
