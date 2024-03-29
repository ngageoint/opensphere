goog.declareModuleId('os.job.JobEventType');

/**
 * Job events indicating when data is ready from the Worker, or an error
 * occurred.
 *
 * @enum {string}
 */
const JobEventType = {
  COMPLETE: 'job:complete',
  DATAREADY: 'job:dataready',
  CHANGE: 'job:change',
  ERROR: 'job:error'
};

export default JobEventType;
