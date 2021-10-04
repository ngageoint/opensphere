goog.declareModuleId('os.load.LoadingManager');

import PropertyChangeEvent from '../events/propertychangeevent.js';
import LoadingEvent from './loadingevent.js';
import LoadingEventType from './loadingeventtype.js';
import LoadingTask from './loadingtask.js';

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const {isEmpty} = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');
const {default: ILoadingTask} = goog.requireType('os.load.ILoadingTask');


/**
 * Manages loading tasks within an application.
 */
export default class LoadingManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {Object<string, ILoadingTask>}
     * @private
     */
    this.loadingTasks_ = {};
  }

  /**
   * Gets the overall loading state.
   *
   * @return {boolean}
   */
  getLoading() {
    return !isEmpty(this.loadingTasks_);
  }

  /**
   * Gets the count of loading things.
   *
   * @return {number}
   */
  getLoadingCount() {
    var count = 0;
    for (var key in this.loadingTasks_) {
      var task = this.loadingTasks_[key];
      count += task.getCount();
    }

    return count;
  }

  /**
   * Adds a loading task by ID. The task is referenced by ID so that can later be removed either by the client who added
   * it (or the client who added it can listen for what it gets removed). Also fires an event if the overall loading
   * state becomes true.
   *
   * @param {string} id ID for the loading task.
   * @param {string=} opt_title Optional title for the loading task.
   * @param {boolean=} opt_cpuIntensive Whether the task is CPU intensive
   */
  addLoadingTask(id, opt_title, opt_cpuIntensive) {
    var oldLoading = this.getLoading();

    if (this.loadingTasks_[id]) {
      // it already exists, so increment its count
      log.fine(this.log, 'Incrementing load count for task ID: ' + id);
      this.loadingTasks_[id].incrementCount();
    } else {
      // it's new, so create it and dispatch the event indicating a new loading task
      log.fine(this.log, 'Adding new loading task with ID: ' + id);
      var task = new LoadingTask(id, opt_title, opt_cpuIntensive);
      task.incrementCount();
      this.loadingTasks_[id] = task;
      this.dispatchEvent(new LoadingEvent(LoadingEventType.ADD, task));
    }

    if (!oldLoading && oldLoading !== this.getLoading()) {
      // loading state has changed, dispatch an event
      var loadingChangeEvent = new PropertyChangeEvent(LoadingManager.LOADING, true, false);
      this.dispatchEvent(loadingChangeEvent);
    }
  }

  /**
   * Removes a loading task by ID. An event is fired so that any interested client can respond to the loading task
   * being removed. Also fires an event if the overall loading state goes to false.
   *
   * @param {string} id
   * @return {?ILoadingTask}
   */
  removeLoadingTask(id) {
    var task = this.loadingTasks_[id];

    if (task) {
      log.fine(this.log, 'Decrementing load count for task ID: ' + id);
      task.decrementCount();

      if (task.getCount() <= 0) {
        log.fine(this.log, 'Removing load task with ID: ' + id);
        delete this.loadingTasks_[id];
        this.dispatchEvent(new LoadingEvent(LoadingEventType.REMOVE, task));
      }

      if (!this.getLoading()) {
        var loadingChangeEvent = new PropertyChangeEvent(LoadingManager.LOADING, false, true);
        this.dispatchEvent(loadingChangeEvent);
      }
    }

    return task;
  }

  /**
   * Get the global instance.
   * @return {!LoadingManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new LoadingManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {LoadingManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {LoadingManager|undefined}
 */
let instance;

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.load.LoadingManager');

/**
 * @type {string}
 * @const
 */
LoadingManager.LOADING = 'loadingManager:loading';
