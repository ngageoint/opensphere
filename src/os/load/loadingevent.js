goog.module('os.load.LoadingEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const ILoadingTask = goog.requireType('os.load.ILoadingTask');

/**
 * Event representing a loading task change.
 */
class LoadingEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {ILoadingTask=} opt_task
   */
  constructor(type, opt_task) {
    super(type);

    /**
     * @type {?ILoadingTask}
     */
    this.task = opt_task || null;
  }

  /**
   * Get the task
   *
   * @return {ILoadingTask}
   */
  getTask() {
    return this.task;
  }

  /**
   * Set the task
   *
   * @param {ILoadingTask} value
   */
  setTask(value) {
    this.task = value;
  }
}

exports = LoadingEvent;
