goog.declareModuleId('os.load.ILoadingTask');

/**
 * Interface representing loading tasks.
 *
 * @interface
 */
export default class ILoadingTask {
  /**
   * Increments the count of things of this type loading
   */
  incrementCount() {}

  /**
   * Decrements the count of things of this type loading
   */
  decrementCount() {}

  /**
   * Gets the loading count.
   * @return {number}
   */
  getCount() {}

  /**
   * Gets the loading duration.
   * @return {number}
   */
  getDuration() {}

  /**
   * Get whether the task is CPU intensive
   * @return {boolean}
   */
  getCPUIntensive() {}

  /**
   * Set whether the task is CPU intensive
   * @param {boolean} value
   */
  setCPUIntensive(value) {}

  /**
   * Get the title
   * @return {?string}
   */
  getTitle() {}

  /**
   * Set the title
   * @param {?string} value
   */
  setTitle(value) {}
}
