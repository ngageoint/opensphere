goog.provide('os.ui.SourceAware');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('ol.events');
goog.require('os.data.DataManager');
goog.require('os.data.event.DataEventType');



/**
 * Abstract class for UI's that need to be aware of what sources are available and visible in the application.
 * Extending classes must call init to load/monitor sources.
 *
 * @deprecated Please use `os.data.SourceManager` instead.
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.SourceAware = function() {
  os.ui.SourceAware.base(this, 'constructor');

  /**
   * Visible sources in the application.
   * @type {!Array<os.source.ISource>}
   * @protected
   */
  this.sources = [];

  /**
   * Map of source listen keys.
   * @type {Object<string, ol.EventsKey>}
   * @private
   */
  this.sourceListeners_ = {};

  /**
   * This smooths out resizing components containing slickgrids by delaying the grid resize until the component stops
   * resizing.
   * @type {goog.async.Delay}
   * @protected
   */
  this.updateDelay = new goog.async.Delay(this.updateUI, 25, this);

  /**
   * Source events that should trigger a UI update.
   * @type {!Array<string>}
   * @protected
   */
  this.updateEvents = os.ui.SourceAware.UPDATE_EVENTS;

  /**
   * @type {!Array<function(os.source.ISource):boolean>}
   * @protected
   */
  this.validationFunctions = os.ui.SourceAware.VALIDATION_FUNCTIONS;
};
goog.inherits(os.ui.SourceAware, goog.Disposable);


/**
 * @type {!Array<function(os.source.ISource):boolean>}
 */
os.ui.SourceAware.VALIDATION_FUNCTIONS = [];


/**
 * @type {!Array<!string>}
 * @const
 */
os.ui.SourceAware.UPDATE_EVENTS = [
  os.source.PropertyChange.TITLE,
  os.source.PropertyChange.VISIBLE];


/**
 * @inheritDoc
 */
os.ui.SourceAware.prototype.disposeInternal = function() {
  os.ui.SourceAware.base(this, 'disposeInternal');

  goog.dispose(this.updateDelay);

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
 * Initialize the sources
 * @protected
 */
os.ui.SourceAware.prototype.init = function() {
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  var sources = dm.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    var source = sources[i];
    this.updateSource_(source);
    this.addSourceListener_(sources[i]);
  }
};


/**
 * @param {!os.source.ISource} source
 * @protected
 */
os.ui.SourceAware.prototype.addSource = function(source) {
  if (this.sources.indexOf(source) === -1) {
    this.sources.push(source);
  }
};


/**
 * @param {!os.source.ISource} source
 * @protected
 */
os.ui.SourceAware.prototype.removeSource = function(source) {
  goog.array.remove(this.sources, source);
};


/**
 * Registers change listener on a source.
 * @param {os.source.ISource} source
 * @private
 */
os.ui.SourceAware.prototype.addSourceListener_ = function(source) {
  this.removeSourceListener_(source);

  var id = source.getId();
  this.sourceListeners_[id] = ol.events.listen(/** @type {ol.events.EventTarget} */ (source),
      goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
};


/**
 * Removes change listener on a source.
 * @param {os.source.ISource} source
 * @private
 */
os.ui.SourceAware.prototype.removeSourceListener_ = function(source) {
  var id = source.getId();
  if (id in this.sourceListeners_) {
    ol.events.unlistenByKey(this.sourceListeners_[id]);
    delete this.sourceListeners_[id];
  }
};


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.ui.SourceAware.prototype.onSourceAdded_ = function(event) {
  if (event.source) {
    this.updateSource_(event.source);
    this.addSourceListener_(event.source);
  }
};


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.ui.SourceAware.prototype.onSourceRemoved_ = function(event) {
  if (event.source) {
    this.removeSourceListener_(event.source);
    this.removeSource(event.source);
  }
};


/**
 * Handle property change events from a source.
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event
 * @protected
 *
 * @suppress {checkTypes}
 */
os.ui.SourceAware.prototype.onSourcePropertyChange = function(event) {
  var p;
  try {
    // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
    // event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  var source = /** @type {os.source.ISource} */ (event.target);
  if (source && this.updateEvents.indexOf(p) > -1) {
    this.updateSource_(source);
  }
};


/**
 * @param {os.source.ISource} source
 * @private
 */
os.ui.SourceAware.prototype.updateSource_ = function(source) {
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
os.ui.SourceAware.prototype.validate_ = function(source) {
  for (var i = 0, n = this.validationFunctions.length; i < n; i++) {
    if (!this.validationFunctions[i](source)) {
      return false;
    }
  }

  return true;
};


/**
 * Update the UI after a source was added/removed/changed.
 * @protected
 */
os.ui.SourceAware.prototype.updateUI = goog.abstractMethod;
