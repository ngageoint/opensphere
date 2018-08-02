goog.provide('os.load.LoadingManager');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.load.LoadingEvent');
goog.require('os.load.LoadingTask');



/**
 * Manages loading tasks within an application.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.load.LoadingManager = function() {
  os.load.LoadingManager.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.load.LoadingManager.LOGGER_;

  /**
   * @type {Object<string, os.load.ILoadingTask>}
   * @private
   */
  this.loadingTasks_ = {};
};
goog.inherits(os.load.LoadingManager, goog.events.EventTarget);
goog.addSingletonGetter(os.load.LoadingManager);


/**
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.load.LoadingManager.LOGGER_ = goog.log.getLogger('os.load.LoadingManager');


/**
 * @type {string}
 * @const
 */
os.load.LoadingManager.LOADING = 'loadingManager:loading';


/**
 * Gets the overall loading state.
 * @return {boolean}
 */
os.load.LoadingManager.prototype.getLoading = function() {
  return !goog.object.isEmpty(this.loadingTasks_);
};


/**
 * Gets the count of loading things.
 * @return {number}
 */
os.load.LoadingManager.prototype.getLoadingCount = function() {
  var count = 0;
  for (var key in this.loadingTasks_) {
    var task = this.loadingTasks_[key];
    count += task.getCount();
  }

  return count;
};


/**
 * Adds a loading task by ID. The task is referenced by ID so that can later be removed either by the client who added
 * it (or the client who added it can listen for what it gets removed). Also fires an event if the overall loading
 * state becomes true.
 *
 * @param {string} id ID for the loading task.
 * @param {string=} opt_title Optional title for the loading task.
 * @param {boolean=} opt_cpuIntensive Whether the task is CPU intensive
 */
os.load.LoadingManager.prototype.addLoadingTask = function(id, opt_title, opt_cpuIntensive) {
  var oldLoading = this.getLoading();

  if (this.loadingTasks_[id]) {
    // it already exists, so increment its count
    goog.log.fine(this.log, 'Incrementing load count for task ID: ' + id);
    this.loadingTasks_[id].incrementCount();
  } else {
    // it's new, so create it and dispatch the event indicating a new loading task
    goog.log.fine(this.log, 'Adding new loading task with ID: ' + id);
    var task = new os.load.LoadingTask(id, opt_title, opt_cpuIntensive);
    task.incrementCount();
    this.loadingTasks_[id] = task;
    this.dispatchEvent(new os.load.LoadingEvent(os.load.LoadingEventType.ADD, task));
  }

  if (!oldLoading && oldLoading !== this.getLoading()) {
    // loading state has changed, dispatch an event
    var loadingChangeEvent = new os.events.PropertyChangeEvent(os.load.LoadingManager.LOADING, true, false);
    this.dispatchEvent(loadingChangeEvent);
  }
};


/**
 * Removes a loading task by ID. An event is fired so that any interested client can respond to the loading task
 * being removed. Also fires an event if the overall loading state goes to false.
 *
 * @param {string} id
 * @return {?os.load.ILoadingTask}
 */
os.load.LoadingManager.prototype.removeLoadingTask = function(id) {
  var task = this.loadingTasks_[id];

  if (task) {
    goog.log.fine(this.log, 'Decrementing load count for task ID: ' + id);
    task.decrementCount();

    if (task.getCount() <= 0) {
      goog.log.fine(this.log, 'Removing load task with ID: ' + id);
      delete this.loadingTasks_[id];
      this.dispatchEvent(new os.load.LoadingEvent(os.load.LoadingEventType.REMOVE, task));
    }

    if (!this.getLoading()) {
      var loadingChangeEvent = new os.events.PropertyChangeEvent(os.load.LoadingManager.LOADING, false, true);
      this.dispatchEvent(loadingChangeEvent);
    }
  }

  return task;
};
