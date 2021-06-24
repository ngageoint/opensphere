goog.module('os.data.OSDataManager');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const PropertyChange = goog.require('os.data.PropertyChange');
const DataEvent = goog.require('os.data.event.DataEvent');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {getMapContainer} = goog.require('os.map.instance');

const Logger = goog.requireType('goog.log.Logger');
const LayerEvent = goog.requireType('os.events.LayerEvent');


/**
 * The data manager provides methods for tracking and registering providers and descriptors in addition
 * to managing individual data sources within the application.
 */
class OSDataManager extends DataManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

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

    var map = getMapContainer();
    map.listen(LayerEventType.ADD, this.onLayerAdded_, false, this);
    map.listen(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var map = getMapContainer();
    map.unlisten(LayerEventType.ADD, this.onLayerAdded_, false, this);
    map.unlisten(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
  }

  /**
   * Settings initialize
   *
   * @private
   */
  init_() {
    // restore time filter flag from settings
    const filterTime = /** @type {boolean} */ (Settings.getInstance().get(OSDataManagerSetting.FILTER_TIME, true));
    this.setTimeFilterEnabled(filterTime);
  }

  /**
   * Gets a source by id
   *
   * @param {string} id
   * @return {?os.source.Vector}
   */
  getSource(id) {
    return this.sources_[id] || null;
  }

  /**
   * Gets the sources
   *
   * @return {!Array.<!os.source.Vector>}
   */
  getSources() {
    var src = [];
    for (var key in this.sources_) {
      src.push(this.sources_[key]);
    }

    return src;
  }

  /**
   * Gets the total count of all the features currently loaded
   *
   * @return {!number}
   */
  getTotalFeatureCount() {
    var count = 0;
    var sources = this.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var fc = sources[i].getFeatureCount();

      if (Number.isInteger(fc)) {
        count += fc;
      } else {
        log.error(logger, 'getFeatureCount() for ' + sources[i].getId() +
            ' was not an integer! ' + fc);
      }
    }

    return count;
  }

  /**
   * Adds a source to the data manager if it doesn't already exist.
   *
   * @param {os.source.Vector} source The source to add
   * @return {boolean} If the source was added
   */
  addSource(source) {
    if (!(source.getId() in this.sources_)) {
      this.sources_[source.getId()] = source;
      source.setTimeFilterEnabled(this.timeFilterEnabled_);
      this.dispatchEvent(new DataEvent(os.data.event.DataEventType.SOURCE_ADDED, source));
      return true;
    }

    return false;
  }

  /**
   * Removes a source from the data manager if it exists.
   *
   * @param {os.source.Vector} source The source to remove
   * @return {boolean} If the source was added
   */
  removeSource(source) {
    if (source.getId() in this.sources_) {
      delete this.sources_[source.getId()];
      this.dispatchEvent(new DataEvent(os.data.event.DataEventType.SOURCE_REMOVED, source));
      return true;
    }

    return false;
  }

  /**
   * If time filters should be enabled on sources.
   *
   * @return {boolean}
   */
  getTimeFilterEnabled() {
    return this.timeFilterEnabled_;
  }

  /**
   * Updates time filter usage on sources.
   *
   * @param {boolean} value
   */
  setTimeFilterEnabled(value) {
    if (this.timeFilterEnabled_ != value) {
      this.timeFilterEnabled_ = value;

      for (var key in this.sources_) {
        this.sources_[key].setTimeFilterEnabled(value);
      }

      Settings.getInstance().set(OSDataManagerSetting.FILTER_TIME, value);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TIME_FILTER_ENABLED, value));
    }
  }

  /**
   * @param {LayerEvent} event
   * @private
   */
  onLayerAdded_(event) {
    if (event.layer instanceof os.layer.Vector) {
      var layer = /** @type {os.layer.Vector} */ (event.layer);
      if (layer.getSource() instanceof os.source.Vector) {
        var source = /** @type {os.source.Vector} */ (layer.getSource());
        this.addSource(source);
      }
    }
  }

  /**
   * @param {LayerEvent} event
   * @private
   */
  onLayerRemoved_(event) {
    if (event.layer instanceof os.layer.Vector) {
      var layer = /** @type {os.layer.Vector} */ (event.layer);
      if (layer.getSource() instanceof os.source.Vector) {
        var source = /** @type {os.source.Vector} */ (layer.getSource());
        this.removeSource(source);
      }
    }
  }

  /**
   * Set the application time from a descriptor.
   *
   * @param {string} id The descriptor id
   * @return {boolean} If the time was changed
   */
  setTimeFromDescriptor(id) {
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
  }

  /**
   * Get the global instance.
   * @return {!OSDataManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new OSDataManager();
      DataManager.setInstance(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {OSDataManager} value
   */
  static setInstance(value) {
    instance = value;

    // Also replace the global DataManager instance.
    DataManager.setInstance(value);
  }
}

/**
 * Global instance.
 * @type {OSDataManager|undefined}
 */
let instance;


/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.data.OSDataManager');


/**
 * Base key for settings.
 * @type {string}
 * @const
 */
OSDataManager.BASE_KEY = 'dataManager';


/**
 * OpenSphere data manager settings.
 * @enum {string}
 */
const OSDataManagerSetting = {
  FILTER_TIME: OSDataManager.BASE_KEY + '.filterTime'
};

exports = OSDataManager;
