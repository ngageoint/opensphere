goog.module('os.data.histo.TimelineHistManager');
goog.module.declareLegacyNamespace();

const Throttle = goog.require('goog.async.Throttle');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const events = goog.require('ol.events');
const {setDataManager} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const DataManager = goog.require('os.data.DataManager');
const DataEventType = goog.require('os.data.event.DataEventType');
const LayerEventType = goog.require('os.events.LayerEventType');
const fn = goog.require('os.fn');
const hist = goog.require('os.hist');
const {getMapContainer} = goog.require('os.map.instance');
const PropertyChange = goog.require('os.source.PropertyChange');
const HistogramEventType = goog.require('os.ui.hist.HistogramEventType');

const DataEvent = goog.requireType('os.data.event.DataEvent');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const IHistogramManager = goog.requireType('os.ui.hist.IHistogramManager');


/**
 * Watches all sources in the data manager for changes that affect the timeline. Fires events on changes to alert the
 * timeline to update itself.
 *
 * @implements {IHistogramManager}
 */
class TimelineHistManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Change event throttle to rate limit timeline updates
     * @type {Throttle}
     * @private
     */
    this.changeThrottle_ = new Throttle(this.onChangeThrottle_, 100, this);

    var sources = DataManager.getInstance().getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = /** @type {events.EventTarget} */ (sources[i]);
      events.listen(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    }

    DataManager.getInstance().listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    DataManager.getInstance().listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    dispatcher.getInstance().listen(LayerEventType.ADD, this.fireChangeEvent_, false, this);
    dispatcher.getInstance().listen(LayerEventType.REMOVE, this.fireChangeEvent_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.changeThrottle_.dispose();
    this.changeThrottle_ = null;

    dispatcher.getInstance().unlisten(LayerEventType.ADD, this.fireChangeEvent_, false, this);
    dispatcher.getInstance().unlisten(LayerEventType.REMOVE, this.fireChangeEvent_, false, this);

    DataManager.getInstance().unlisten(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    DataManager.getInstance().unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    var sources = DataManager.getInstance().getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = /** @type {events.EventTarget} */ (sources[i]);
      events.unlisten(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    }

    setDataManager(null);
  }

  /**
   * Initiates the change event throttle to rate limit the events.
   *
   * @private
   */
  fireChangeEvent_() {
    this.changeThrottle_.fire();
  }

  /**
   * Fires a histogram change event.
   *
   * @private
   */
  onChangeThrottle_() {
    this.dispatchEvent(HistogramEventType.CHANGE);
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onSourceAdded_(event) {
    if (event.source) {
      events.listen(/** @type {events.EventTarget} */ (event.source), GoogEventType.PROPERTYCHANGE,
          this.onSourcePropertyChange_, this);
      this.fireChangeEvent_();
    }
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event.source) {
      events.unlisten(/** @type {events.EventTarget} */ (event.source), GoogEventType.PROPERTYCHANGE,
          this.onSourcePropertyChange_, this);
      this.fireChangeEvent_();
    }
  }

  /**
   * Handles source property change events. Fires a histogram change event when the property affects the histogram.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onSourcePropertyChange_(event) {
    var prop = event.getProperty();
    switch (prop) {
      case PropertyChange.FEATURE_VISIBILITY:
        var newVal = event.getNewValue();
        if (!newVal) {
          // visible features changed due to a timeline change, not a data visibility change
          break;
        }
        // fall through
      case PropertyChange.COLOR:
      case PropertyChange.FEATURES:
      case PropertyChange.TIME_ENABLED:
      case PropertyChange.TIME_MODEL:
      case PropertyChange.TITLE:
      case PropertyChange.VISIBLE:
        this.fireChangeEvent_();
        break;
      default:
        break;
    }
  }

  /**
   * @inheritDoc
   */
  getHistograms(options) {
    var histograms = [];

    if (options.interval > 0) {
      var layers = getMapContainer().getLayers();
      histograms = layers.map((layer) => hist.mapLayerToHistogram(layer, options))
          .filter(fn.filterFalsey);

      if (!histograms.length) {
        var sources = DataManager.getInstance().getSources();
        histograms = sources.map((source) => hist.mapSourceToHistogram(source, options))
            .filter(fn.filterFalsey);
      }
    }

    return histograms;
  }

  /**
   * Get the global instance.
   * @return {!TimelineHistManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new TimelineHistManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {TimelineHistManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {TimelineHistManager|undefined}
 */
let instance;

exports = TimelineHistManager;
