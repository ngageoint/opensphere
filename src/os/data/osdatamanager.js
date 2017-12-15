goog.provide('os.data.OSDataManager');
goog.provide('os.data.PropertyChange');

goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.config.Settings');
goog.require('os.data.DataManager');
goog.require('os.data.IDataProvider');
goog.require('os.data.ProviderEntry');
goog.require('os.data.event.DataEvent');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.ArrayCollection');
goog.require('os.ui.slick.SlickTreeNode');


/**
 * @enum {string}
 */
os.data.PropertyChange = {
  TIME_FILTER_ENABLED: 'timeFilterEnabled'
};



/**
 * The data manager provides methods for tracking and registering providers and descriptors in addition
 * to managing individual data sources within the application.
 * @extends {os.data.DataManager}
 * @constructor
 */
os.data.OSDataManager = function() {
  os.data.OSDataManager.base(this, 'constructor');
  this.log = os.data.OSDataManager.LOGGER_;

  /**
   * @type {!Object.<string, !os.source.Vector>}
   * @private
   */
  this.sources_ = {};

  /**
   * If displayed data should be filtered by the timeline.
   * @type {boolean}
   * @private
   */
  this.timeFilterEnabled_ = true;

  this.init_();

  var map = os.MapContainer.getInstance();
  map.listen(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);
  map.listen(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
};
goog.inherits(os.data.OSDataManager, os.data.DataManager);
goog.addSingletonGetter(os.data.OSDataManager);

// replace the os.ui DataManager's getInstance with this one so we never instantiate a second instance
goog.object.extend(os.data.DataManager, {
  getInstance: function() {
    return os.data.OSDataManager.getInstance();
  }
});


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.data.OSDataManager.LOGGER_ = goog.log.getLogger('os.data.OSDataManager');


/**
 * Base key for settings.
 * @type {string}
 * @const
 */
os.data.OSDataManager.BASE_KEY = 'dataManager';


/**
 * OpenSphere data manager settings.
 * @enum {string}
 */
os.data.OSDataManagerSetting = {
  FILTER_TIME: os.data.OSDataManager.BASE_KEY + '.filterTime'
};


/**
 * @inheritDoc
 */
os.data.OSDataManager.prototype.disposeInternal = function() {
  os.data.OSDataManager.base(this, 'disposeInternal');

  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.ADD, this.onLayerAdded_, false, this);
  map.unlisten(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
};


/**
 * Settings initialize
 * @private
 */
os.data.OSDataManager.prototype.init_ = function() {
  // restore time filter flag from settings
  this.setTimeFilterEnabled(/** @type {boolean} */ (os.settings.get(
      os.data.OSDataManagerSetting.FILTER_TIME, true)));
};


/**
 * Gets a source by id
 * @param {string} id
 * @return {?os.source.Vector}
 */
os.data.OSDataManager.prototype.getSource = function(id) {
  return this.sources_[id] || null;
};


/**
 * Gets the sources
 * @return {!Array.<!os.source.Vector>}
 */
os.data.OSDataManager.prototype.getSources = function() {
  var src = [];
  for (var key in this.sources_) {
    src.push(this.sources_[key]);
  }

  return src;
};


/**
 * Gets the total count of all the features currently loaded
 * @return {number}
 */
os.data.OSDataManager.prototype.getTotalFeatureCount = function() {
  var count = 0;
  var sources = this.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    count += sources[i].getFeatureCount();
  }

  return count;
};


/**
 * Adds a source to the data manager if it doesn't already exist.
 * @param {os.source.Vector} source The source to add
 * @return {boolean} If the source was added
 */
os.data.OSDataManager.prototype.addSource = function(source) {
  if (!(source.getId() in this.sources_)) {
    this.sources_[source.getId()] = source;
    source.setTimeFilterEnabled(this.timeFilterEnabled_);
    this.dispatchEvent(new os.data.event.DataEvent(os.data.event.DataEventType.SOURCE_ADDED, source));
    return true;
  }

  return false;
};


/**
 * Removes a source from the data manager if it exists.
 * @param {os.source.Vector} source The source to remove
 * @return {boolean} If the source was added
 */
os.data.OSDataManager.prototype.removeSource = function(source) {
  if (source.getId() in this.sources_) {
    delete this.sources_[source.getId()];
    this.dispatchEvent(new os.data.event.DataEvent(os.data.event.DataEventType.SOURCE_REMOVED, source));
    return true;
  }

  return false;
};


/**
 * If time filters should be enabled on sources.
 * @return {boolean}
 */
os.data.OSDataManager.prototype.getTimeFilterEnabled = function() {
  return this.timeFilterEnabled_;
};


/**
 * Updates time filter usage on sources.
 * @param {boolean} value
 */
os.data.OSDataManager.prototype.setTimeFilterEnabled = function(value) {
  if (this.timeFilterEnabled_ != value) {
    this.timeFilterEnabled_ = value;

    for (var key in this.sources_) {
      this.sources_[key].setTimeFilterEnabled(value);
    }

    os.settings.set(os.data.OSDataManagerSetting.FILTER_TIME, value);
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.data.PropertyChange.TIME_FILTER_ENABLED, value));
  }
};


/**
 * @param {os.events.LayerEvent} event
 * @private
 */
os.data.OSDataManager.prototype.onLayerAdded_ = function(event) {
  if (event.layer instanceof os.layer.Vector) {
    var layer = /** @type {os.layer.Vector} */ (event.layer);
    if (layer.getSource() instanceof os.source.Vector) {
      var source = /** @type {os.source.Vector} */ (layer.getSource());
      this.addSource(source);
    }
  }
};


/**
 * @param {os.events.LayerEvent} event
 * @private
 */
os.data.OSDataManager.prototype.onLayerRemoved_ = function(event) {
  if (event.layer instanceof os.layer.Vector) {
    var layer = /** @type {os.layer.Vector} */ (event.layer);
    if (layer.getSource() instanceof os.source.Vector) {
      var source = /** @type {os.source.Vector} */ (layer.getSource());
      this.removeSource(source);
    }
  }
};


/**
 * Set the application time from a descriptor.
 * @param {string} id The descriptor id
 * @return {boolean} If the time was changed
 */
os.data.OSDataManager.prototype.setTimeFromDescriptor = function(id) {
  var descriptor = this.getDescriptor(id);
  if (descriptor) {
    var maxDate = descriptor.getMaxDate();
    if (maxDate > 0 && maxDate < os.time.TimeInstant.MAX_TIME) {
      // try to clamp this to reasonable values, avoiding unbounded end dates
      os.time.TimelineController.getInstance().setRangeStart(maxDate);
      return true;
    }
  }

  return false;
};


/**
 * @type {os.data.OSDataManager}
 */
os.osDataManager = null;
