goog.provide('os.query.QueryHandler');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('ol.events');
goog.require('os.filter.FilterEntry');
goog.require('os.filter.IFilterFormatter');
goog.require('os.filter.ISpatialFormatter');
goog.require('os.ui.query.QueryHandler');



/**
 * Query handler implementation. Adds source, refresh and request functionality to the base handler class.
 * @constructor
 * @extends {os.ui.query.QueryHandler}
 */
os.query.QueryHandler = function() {
  /**
   * @type {boolean}
   * @private
   */
  this.refreshOnVisible_ = false;

  /**
   * @type {goog.async.Delay}
   * @protected
   */
  this.refreshTimer = new goog.async.Delay(this.onRefreshTimer, 250, this);

  /**
   * @type {?os.source.Request}
   * @protected
   */
  this.source = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.spatialRequired = false;
};
goog.inherits(os.query.QueryHandler, os.ui.query.QueryHandler);


/**
 * @inheritDoc
 */
os.query.QueryHandler.prototype.disposeInternal = function() {
  os.query.QueryHandler.base(this, 'disposeInternal');
  this.refreshTimer.dispose();
  this.setSource(null);
};


/**
 * Get the source.
 * @return {?os.source.Request}
 */
os.query.QueryHandler.prototype.getSource = function() {
  return this.source;
};


/**
 * @inheritDoc
 */
os.query.QueryHandler.prototype.getLayerName = function() {
  return this.source ? this.source.getTitle() : '';
};


/**
 * Set the source.
 * @param {?os.source.Request} source
 */
os.query.QueryHandler.prototype.setSource = function(source) {
  var qm = os.ui.queryManager;

  if (this.source) {
    this.setLayerId(null);
    this.setLayerName(null);
    qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onQueryChange, false, this);
    ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
  }

  this.source = source;

  if (this.source) {
    this.setLayerId(this.source.getId());

    // all source refreshing should now go through this handler
    this.source.refresh = this.refresh.bind(this);

    qm.listen(goog.events.EventType.PROPERTYCHANGE, this.onQueryChange, false, this);
    ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.query.QueryHandler.prototype.onSourcePropertyChange = function(event) {
  if (event.getProperty() == 'visible') {
    if (this.source.getVisible() && this.refreshOnVisible_) {
      this.refreshOnVisible_ = false;
      this.localRefresh();
    }
  }
};


/**
 * On queries changed
 * @param {os.events.PropertyChangeEvent} event
 */
os.query.QueryHandler.prototype.onQueryChange = function(event) {
  var ids = event.getNewValue();
  var id = this.source.getId();

  if ('*' in ids || id in ids) {
    this.source.clear();
    this.refresh();
  }
};


/**
 * Refresh timer
 * @protected
 */
os.query.QueryHandler.prototype.onRefreshTimer = function() {
  if (!this.source.isLoading()) {
    this.localRefresh();
  } else {
    this.refreshTimer.start();
  }
};


/**
 * @protected
 */
os.query.QueryHandler.prototype.localRefresh = function() {
  if (!this.refreshTimer.isActive()) {
    if (this.source.getVisible()) {
      this.resetModifiers();
      this.doRefresh();
    } else {
      this.refreshOnVisible_ = true;
    }
  }
};


/**
 * Actually refresh
 * @protected
 */
os.query.QueryHandler.prototype.doRefresh = function() {
  if (!this.spatialRequired || this.modifier.getReplacement()) {
    this.source.loadRequest();
  }
};


/**
 * Refresh
 * @param {boolean=} opt_now Does the refresh now rather than on a timer
 */
os.query.QueryHandler.prototype.refresh = function(opt_now) {
  var qm = os.ui.queryManager;
  var id = this.source.getId();

  if (this.spatialRequired) {
    if (qm.hasInclusion(id) || qm.hasInclusion('*')) {
      this.scheduleRefresh(opt_now);
    } else {
      this.source.clear();
    }
  } else {
    this.scheduleRefresh(opt_now);
  }
};


/**
 * Schedules a refresh
 * @param {boolean=} opt_now
 * @protected
 */
os.query.QueryHandler.prototype.scheduleRefresh = function(opt_now) {
  if (opt_now) {
    this.localRefresh();
  } else {
    // abort the current request if one is going, but don't clear the source yet
    this.source.abortRequest();
    this.refreshTimer.start();
  }
};


/**
 * @protected
 */
os.query.QueryHandler.prototype.resetModifiers = function() {
  var newFilter = this.createFilter();
  this.modifier.setReplacement(newFilter);

  var request = this.source.getRequest();

  if (request) {
    request.removeModifier(this.modifier);
    request.addModifier(this.modifier);
  }

  if (this.spatialRequired && !newFilter) {
    this.source.clear();
  }
};
