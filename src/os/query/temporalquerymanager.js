goog.provide('os.query.TemporalQueryManager');
goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.string');
goog.require('os.data.DataManager');
goog.require('os.data.event.DataEventType');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');



/**
 * @extends {goog.Disposable}
 * @constructor
 */
os.query.TemporalQueryManager = function() {
  /**
   * @type {!Object.<string, os.query.TemporalHandler>}
   * @private
   */
  this.handlers_ = {};

  /**
   * @type {os.time.TimelineController}
   * @private
   */
  this.controller_ = os.time.TimelineController.getInstance();
  this.controller_.listen(os.time.TimelineEventType.RESET, this.onTimelineReset_, false, this);

  os.dataManager.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);
};
goog.inherits(os.query.TemporalQueryManager, goog.Disposable);
goog.addSingletonGetter(os.query.TemporalQueryManager);


/**
 * @inheritDoc
 */
os.query.TemporalQueryManager.prototype.disposeInternal = function() {
  os.query.TemporalQueryManager.base(this, 'disposeInternal');

  this.controller_.unlisten(os.time.TimelineEventType.RESET, this.onTimelineReset_, false, this);
  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);
};


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.query.TemporalQueryManager.prototype.onDataSourceRemoved_ = function(event) {
  if (event.source && this.hasHandler(event.source.getId())) {
    this.unregisterHandler(event.source.getId());
  }
};


/**
 * @param {os.time.TimelineControllerEvent} event
 * @private
 */
os.query.TemporalQueryManager.prototype.onTimelineReset_ = function(event) {
  for (var id in this.handlers_) {
    this.handlers_[id].handleTimelineReset(this.controller_);
  }
};


/**
 * Gets a handler if a matching one is registered with the manager.
 * @param {string} id Id of the handler
 * @return {?os.query.TemporalHandler} The handler, if it has been registered
 */
os.query.TemporalQueryManager.prototype.getHandler = function(id) {
  return this.hasHandler(id) ? this.handlers_[id] : null;
};


/**
 * Checks if a handler is registered with the manager.
 * @param {string} id Id of the handler
 * @return {boolean} If the handler is registered
 */
os.query.TemporalQueryManager.prototype.hasHandler = function(id) {
  return id in this.handlers_;
};


/**
 * Registers a handler with the manager.
 * @param {string} id Id of the handler
 * @param {os.query.TemporalHandler} handler The handler
 */
os.query.TemporalQueryManager.prototype.registerHandler = function(id, handler) {
  goog.asserts.assert(!goog.string.isEmptySafe(id), 'Cannot register handler with empty/null id!');
  goog.asserts.assert(handler != null, 'Cannot register null handler (id = ' + id + ')');

  this.handlers_[id] = handler;
  handler.handleTimelineReset(this.controller_, false);
};


/**
 * Unregisters a handler with the manager.
 * @param {string} id Id of the handler
 */
os.query.TemporalQueryManager.prototype.unregisterHandler = function(id) {
  delete this.handlers_[id];
};
