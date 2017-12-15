goog.provide('os.load.LoadingEvent');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.load.LoadingEventType = {
  ADD: 'load:add',
  REMOVE: 'load:remove'
};



/**
 * Event representing a loading task change.
 * @param {string} type
 * @param {os.load.ILoadingTask=} opt_task
 * @extends {goog.events.Event}
 * @constructor
 */
os.load.LoadingEvent = function(type, opt_task) {
  os.load.LoadingEvent.base(this, 'constructor', type);

  /**
   * @type {?os.load.ILoadingTask}
   */
  this.task = opt_task || null;
};
goog.inherits(os.load.LoadingEvent, goog.events.Event);


/**
 * Get the task
 * @return {os.load.ILoadingTask}
 */
os.load.LoadingEvent.prototype.getTask = function() {
  return this.task;
};


/**
 * Set the task
 * @param {os.load.ILoadingTask} value
 */
os.load.LoadingEvent.prototype.setTask = function(value) {
  this.task = value;
};
