goog.module('os.query.TemporalQueryManager');

const Disposable = goog.require('goog.Disposable');
const {assert} = goog.require('goog.asserts');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const DataManager = goog.require('os.data.DataManager');
const DataEventType = goog.require('os.data.event.DataEventType');
const TimelineController = goog.require('os.time.TimelineController');
const TimelineEventType = goog.require('os.time.TimelineEventType');

const DataEvent = goog.requireType('os.data.event.DataEvent');
const TemporalHandler = goog.requireType('os.query.TemporalHandler');
const TimelineControllerEvent = goog.requireType('os.time.TimelineControllerEvent');


/**
 */
class TemporalQueryManager extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!Object<string, TemporalHandler>}
     * @private
     */
    this.handlers_ = {};

    /**
     * @type {TimelineController}
     * @private
     */
    this.controller_ = TimelineController.getInstance();
    this.controller_.listen(TimelineEventType.RESET, this.onTimelineReset_, false, this);

    DataManager.getInstance().listen(DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.controller_.unlisten(TimelineEventType.RESET, this.onTimelineReset_, false, this);
    DataManager.getInstance().unlisten(DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onDataSourceRemoved_(event) {
    if (event.source && this.hasHandler(event.source.getId())) {
      this.unregisterHandler(event.source.getId());
    }
  }

  /**
   * @param {TimelineControllerEvent} event
   * @private
   */
  onTimelineReset_(event) {
    for (var id in this.handlers_) {
      this.handlers_[id].handleTimelineReset(this.controller_);
    }
  }

  /**
   * Gets a handler if a matching one is registered with the manager.
   *
   * @param {string} id Id of the handler
   * @return {?TemporalHandler} The handler, if it has been registered
   */
  getHandler(id) {
    return this.hasHandler(id) ? this.handlers_[id] : null;
  }

  /**
   * Checks if a handler is registered with the manager.
   *
   * @param {string} id Id of the handler
   * @return {boolean} If the handler is registered
   */
  hasHandler(id) {
    return id in this.handlers_;
  }

  /**
   * Registers a handler with the manager.
   *
   * @param {string} id Id of the handler
   * @param {TemporalHandler} handler The handler
   */
  registerHandler(id, handler) {
    assert(!isEmptyOrWhitespace(makeSafe(id)), 'Cannot register handler with empty/null id!');
    assert(handler != null, 'Cannot register null handler (id = ' + id + ')');

    this.handlers_[id] = handler;
    handler.handleTimelineReset(this.controller_, false);
  }

  /**
   * Unregisters a handler with the manager.
   *
   * @param {string} id Id of the handler
   */
  unregisterHandler(id) {
    delete this.handlers_[id];
  }

  /**
   * Get the global instance.
   * @return {!TemporalQueryManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new TemporalQueryManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {TemporalQueryManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {TemporalQueryManager|undefined}
 */
let instance;

exports = TemporalQueryManager;
