goog.module('os.load.LoadingTask');
goog.module.declareLegacyNamespace();

const ILoadingTask = goog.requireType('os.load.ILoadingTask');


/**
 * Base implementation of a loading task.
 *
 * @implements {ILoadingTask}
 */
class LoadingTask {
  /**
   * Constructor.
   * @param {string} id
   * @param {string=} opt_title
   * @param {boolean=} opt_cpuIntensive
   */
  constructor(id, opt_title, opt_cpuIntensive) {
    /**
     * @type {string}
     * @protected
     */
    this.id = id;

    /**
     * @type {number}
     * @protected
     */
    this.start = Date.now();

    /**
     * @type {number}
     * @protected
     */
    this.count = 0;

    /**
     * @type {?string}
     * @protected
     */
    this.title = opt_title || null;

    /**
     * @type {boolean}
     * @protected
     */
    this.cpuIntensive = opt_cpuIntensive || false;
  }

  /**
   * @inheritDoc
   */
  incrementCount() {
    this.count++;
  }

  /**
   * @inheritDoc
   */
  decrementCount() {
    this.count--;
  }

  /**
   * @inheritDoc
   */
  getCount() {
    return this.count;
  }

  /**
   * @inheritDoc
   */
  getDuration() {
    return Date.now() - this.start;
  }

  /**
   * @inheritDoc
   */
  getCPUIntensive() {
    return this.cpuIntensive;
  }

  /**
   * @inheritDoc
   */
  setCPUIntensive(value) {
    this.cpuIntensive = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.title = value;
  }
}

exports = LoadingTask;
