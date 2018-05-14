goog.provide('os.data.SourceManager');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('ol.events');
goog.require('os.data.DataManager');
goog.require('os.data.event.DataEventType');
goog.require('os.source.PropertyChange');


/**
 * Watches all sources in the data manager and provides custom management for sources matching a set of validation
 * functions. Source events may be handled directly by extending `onSourcePropertyChange`, or on a delay by setting
 * `updateEvents` to the list of events that should be handled on a delay and extending `onUpdateDelay`.
 *
 * To start watching sources, `init` must be called on the manager.
 *
 * @extends {goog.Disposable}
 * @constructor
 */
os.data.SourceManager = function() {
  os.data.SourceManager.base(this, 'constructor');

  /**
   * Managed sources.
   * @type {!Array<!os.source.ISource>}
   * @protected
   */
  this.sources = [];

  /**
   * Map of source listen keys.
   * @type {!Object<string, !ol.EventsKey>}
   * @private
   */
  this.sourceListeners_ = {};

  /**
   * Delay to debounce updates from source changes.
   * @type {goog.async.Delay}
   * @protected
   */
  this.updateDelay = new goog.async.Delay(this.onUpdateDelay, 25, this);

  /**
   * Source events that should trigger an update.
   * @type {!Array<string>}
   * @protected
   */
  this.updateEvents = os.data.SourceManager.UPDATE_EVENTS;

  /**
   * Functions to test if the source should be managed.
   * @type {!Array<function(os.source.ISource):boolean>}
   * @protected
   */
  this.validationFunctions = os.data.SourceManager.VALIDATION_FUNCTIONS;
};
goog.inherits(os.data.SourceManager, goog.Disposable);


/**
 * @type {!Array<function(os.source.ISource):boolean>}
 * @const
 */
os.data.SourceManager.VALIDATION_FUNCTIONS = [];


/**
 * @type {!Array<!string>}
 * @const
 */
os.data.SourceManager.UPDATE_EVENTS = [
  os.source.PropertyChange.TITLE,
  os.source.PropertyChange.VISIBLE
];


/**
 * @inheritDoc
 */
os.data.SourceManager.prototype.disposeInternal = function() {
  os.data.SourceManager.base(this, 'disposeInternal');

  var dm = os.dataManager;
  if (dm) {
    dm.unlisten(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  for (var key in this.sourceListeners_) {
    ol.events.unlistenByKey(this.sourceListeners_[key]);
  }

  this.sourceListeners_ = {};
  this.sources.length = 0;
};


/**
 * Initialize the manager.
 */
os.data.SourceManager.prototype.init = function() {
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  var sources = dm.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    var source = sources[i];
    if (source) {
      this.updateSource(source);
      this.addSourceListener_(sources[i]);
    }
  }
};


/**
 * Handle remove add events from the data manager.
 * @param {!os.source.ISource} source The source.
 * @protected
 */
os.data.SourceManager.prototype.addSource = function(source) {
  if (this.sources.indexOf(source) === -1) {
    this.sources.push(source);
  }
};


/**
 * Handle remove source events from the data manager.
 * @param {!os.source.ISource} source The source.
 * @protected
 */
os.data.SourceManager.prototype.removeSource = function(source) {
  goog.array.remove(this.sources, source);
};


/**
 * Registers change listener on a source.
 * @param {!os.source.ISource} source The source.
 * @private
 */
os.data.SourceManager.prototype.addSourceListener_ = function(source) {
  this.removeSourceListener_(source);

  var id = source.getId();
  this.sourceListeners_[id] = ol.events.listen(/** @type {ol.events.EventTarget} */ (source),
      goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
};


/**
 * Removes change listener on a source.
 * @param {!os.source.ISource} source The source.
 * @private
 */
os.data.SourceManager.prototype.removeSourceListener_ = function(source) {
  var id = source.getId();
  if (id in this.sourceListeners_) {
    ol.events.unlistenByKey(this.sourceListeners_[id]);
    delete this.sourceListeners_[id];
  }
};


/**
 * Handle source added event from the data manager.
 * @param {os.data.event.DataEvent} event The data event.
 * @private
 */
os.data.SourceManager.prototype.onSourceAdded_ = function(event) {
  if (event.source) {
    this.updateSource(event.source);
    this.addSourceListener_(event.source);
  }
};


/**
 * Handle source added removed from the data manager.
 * @param {os.data.event.DataEvent} event The data event.
 * @private
 */
os.data.SourceManager.prototype.onSourceRemoved_ = function(event) {
  if (event.source) {
    this.removeSourceListener_(event.source);
    this.removeSource(event.source);
  }
};


/**
 * @param {!os.source.ISource} source The source.
 * @protected
 */
os.data.SourceManager.prototype.updateSource = function(source) {
  if (source) {
    if (this.validate_(source)) {
      this.addSource(source);
    } else {
      this.removeSource(source);
    }

    this.updateDelay.start();
  }
};


/**
 * @param {!os.source.ISource} source The source to validate
 * @return {boolean} whether or not the source is valid
 * @private
 */
os.data.SourceManager.prototype.validate_ = function(source) {
  for (var i = 0, n = this.validationFunctions.length; i < n; i++) {
    if (!this.validationFunctions[i](source)) {
      return false;
    }
  }

  return true;
};


/**
 * Handle property change events from a source.
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event
 * @protected
 */
os.data.SourceManager.prototype.onSourcePropertyChange = function(event) {
  var p;
  try {
    // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
    // event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  var source = /** @type {os.source.ISource} */ (event.target);
  if (source && p && this.updateEvents.indexOf(p) > -1) {
    this.updateSource(source);
  }
};


/**
 * Handler for the update delay.
 * @protected
 */
os.data.SourceManager.prototype.onUpdateDelay = function() {
  // do nothing by default
};
