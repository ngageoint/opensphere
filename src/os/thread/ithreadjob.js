goog.declareModuleId('os.thread.IThreadJob');

/**
 * An interface that describes a job run by a thread
 *
 * @interface
 */
export default class IThreadJob {
  /**
   * Executes a portion of the job. It is up to the implementation to determine
   * how much work to do.
   *
   * @return {boolean} <code>True</code> if the thread is completely finished processing
   *  and does not need to run again, <code>false</code> otherwise.
   */
  executeNext() {}

  /**
   * Cleans up the job
   */
  dispose() {}

  /**
   * @return {number} The number of processed items
   */
  getLoaded() {}

  /**
   * @return {number} The number of items to process
   */
  getTotal() {}
}
