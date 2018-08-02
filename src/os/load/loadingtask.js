goog.provide('os.load.LoadingTask');
goog.require('os.load.ILoadingTask');



/**
 * Base implementation of a loading task.
 * @param {string} id
 * @param {string=} opt_title
 * @param {boolean=} opt_cpuIntensive
 * @implements {os.load.ILoadingTask}
 * @constructor
 */
os.load.LoadingTask = function(id, opt_title, opt_cpuIntensive) {
  /**
   * @type {string}
   * @protected
   */
  this.id = id;

  /**
   * @type {number}
   * @protected
   */
  this.start = goog.now();

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
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.incrementCount = function() {
  this.count++;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.decrementCount = function() {
  this.count--;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.getCount = function() {
  return this.count;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.getDuration = function() {
  return goog.now() - this.start;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.getCPUIntensive = function() {
  return this.cpuIntensive;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.setCPUIntensive = function(value) {
  this.cpuIntensive = value;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.getTitle = function() {
  return this.title;
};


/**
 * @inheritDoc
 */
os.load.LoadingTask.prototype.setTitle = function(value) {
  this.title = value;
};
