goog.provide('os.load.ILoadingTask');



/**
 * Interface representing loading tasks.
 * @interface
 */
os.load.ILoadingTask = function() {};


/**
 * Increments the count of things of this type loading
 */
os.load.ILoadingTask.prototype.incrementCount;


/**
 * Decrements the count of things of this type loading
 */
os.load.ILoadingTask.prototype.decrementCount;


/**
 * Gets the loading count.
 * @return {number}
 */
os.load.ILoadingTask.prototype.getCount;


/**
 * Gets the loading duration.
 * @return {number}
 */
os.load.ILoadingTask.prototype.getDuration;


/**
 * Get whether the task is CPU intensive
 * @return {boolean}
 */
os.load.ILoadingTask.prototype.getCPUIntensive;


/**
 * Set whether the task is CPU intensive
 * @param {boolean} value
 */
os.load.ILoadingTask.prototype.setCPUIntensive;


/**
 * Get the title
 * @return {?string}
 */
os.load.ILoadingTask.prototype.getTitle;


/**
 * Set the title
 * @param {?string} value
 */
os.load.ILoadingTask.prototype.setTitle;
