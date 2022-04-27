goog.declareModuleId('os.data.histo.TimelineHistManager');

import {listen, unlistenByKey} from 'ol/src/events.js';

import * as dispatcher from '../../dispatcher.js';
import LayerEventType from '../../events/layereventtype.js';
import * as fn from '../../fn/fn.js';
import * as hist from '../../hist/hist.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {setDataManager} from '../../os.js';
import PropertyChange from '../../source/propertychange.js';
import HistogramEventType from '../../ui/hist/histogrameventtype.js';
import DataManager from '../datamanager.js';
import DataEventType from '../event/dataeventtype.js';

const Throttle = goog.require('goog.async.Throttle');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');

const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: IHistogramManager} = goog.requireType('os.ui.hist.IHistogramManager');


/**
 * Watches all sources in the data manager for changes that affect the timeline. Fires events on changes to alert the
 * timeline to update itself.
 *
 * @implements {IHistogramManager}
 */
export default class TimelineHistManager extends EventTarget {
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

    this.listenKeys_ = {};

    var sources = DataManager.getInstance().getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = /** @type {events.EventTarget} */ (sources[i]);
      this.listenKeys_[source] = listen(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
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

    for (const source in this.listenKeys_) {
      unlistenByKey(this.listenKeys_[source]);
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
      this.listenKeys_[event.source] = listen(/** @type {events.EventTarget} */ (event.source),
          GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
      this.fireChangeEvent_();
    }
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event.source && this.listenKeys_[event.source]) {
      unlistenByKey(this.listenKeys_[event.source]);
      delete this.listenKeys_[event.source];
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
