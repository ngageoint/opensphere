goog.provide('os.thread.IThreadJob');



/**
 * An interface that describes a job run by a thread
 * @interface
 */
os.thread.IThreadJob = function() {};


/**
 * Executes a portion of the job. It is up to the implementation to determine
 * how much work to do.
 *
 * @return {boolean} <code>True</code> if the thread is completely finished processing
 *  and does not need to run again, <code>false</code> otherwise.
 */
os.thread.IThreadJob.prototype.executeNext;


/**
 * Cleans up the job
 */
os.thread.IThreadJob.prototype.dispose;


/**
 * @return {number} The number of processed items
 */
os.thread.IThreadJob.prototype.getLoaded;


/**
 * @return {number} The number of items to process
 */
os.thread.IThreadJob.prototype.getTotal;
