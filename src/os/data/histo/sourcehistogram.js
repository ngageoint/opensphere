goog.declareModuleId('os.data.histo.SourceHistogram');

import {listen, unlistenByKey} from 'ol/src/events.js';

import * as dispatcher from '../../dispatcher.js';
import * as osFeature from '../../feature/feature.js';
import DateRangeBinType from '../../histo/daterangebintype.js';
import * as osHisto from '../../histo/histo.js';
import PropertyChange from '../../source/propertychange.js';
import FeatureEventType from '../featureeventtype.js';
import DataModel from '../xf/datamodel.js';
import ColorBin from './colorbin.js';
import {HistoEventType} from './histogramutils.js';

const googArray = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: FeatureEvent} = goog.requireType('os.data.FeatureEvent');
const {default: ColorMethod} = goog.requireType('os.data.histo.ColorMethod');
const {default: IGroupable} = goog.requireType('os.data.xf.IGroupable');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: DateBinMethod} = goog.requireType('os.histo.DateBinMethod');
const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');
const {default: Result} = goog.requireType('os.histo.Result');
const osHistoBin = goog.requireType('os.histo.bin');
const {default: Vector} = goog.requireType('os.source.Vector');
const {default: TimeModel} = goog.requireType('os.time.xf.TimeModel');


/**
 * Histogram with cascade support.
 *
 * Do not instantiate this directly! Please use {@link Vector#createHistogram} to make sure the model is
 * created in the same window context as the source.
 *
 * @implements {IGroupable<Feature>}
 */
export default class SourceHistogram extends EventTarget {
  /**
   * Constructor.
   * @param {Vector} source The source for the histogram
   * @param {SourceHistogram=} opt_parent Parent histogram for cascading
   */
  constructor(source, opt_parent) {
    super();

    /**
     * Unique identifier for the source histogram.
     * @type {string}
     * @private
     */
    this.id_ = SourceHistogram.ID + SourceHistogram.nextId++;

    /**
     * The user-facing name for the histogram.
     * @type {?string}
     * @protected
     */
    this.name = null;

    /**
     * Key for xf dimension with multi key string
     * @type {string}
     * @private
     */
    this.multiId_ = this.id_ + 'multi';

    /**
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * Count how many objects are referring to the histogram to prevent premature disposal.
     * @type {number}
     * @private
     */
    this.refCount_ = 0;

    /**
     * @type {?IBinMethod<Feature>}
     * @protected
     */
    this.binMethod = null;

    /**
     * Bin method that does not get it's own dimension on the dataModel, rather it creates a dimension pivoted
     * from this.binMethod
     * @type {?IBinMethod<Feature>}
     * @protected
     */
    this.secondaryBinMethod = null;

    /**
     * The accessor function created from smashing together the primary and secondary bin methods
     * @type {null|function(Feature):string}
     * @protected
     */
    this.combinedAccessor = null;

    /**
     * The key method created from smashing together the primary and secondary key functions
     * @type {null|function(string):string}
     * @protected
     */
    this.combinedKeyMethod = null;

    /**
     * The source for the histogram
     * @type {Vector}
     * @protected
     */
    this.source = source;

    /**
     * The latest histogram results.
     * @type {!Array<!ColorBin>}
     * @protected
     */
    this.results = [];

    /**
     * The parent histogram for cascading results
     * @type {SourceHistogram}
     * @private
     */
    this.parent_ = null;

    /**
     * Values to cascade to child histograms.
     * @type {Array<*>}
     * @private
     */
    this.cascadeValues_ = null;

    /**
     * The source's time model
     * @type {TimeModel}
     * @private
     */
    this.timeModel_ = source.getTimeModel();

    /**
     * Whether applicable time values should be binned as ranges
     * @type {boolean}
     * @private
     */
    this.binRanges_ = false;

    /**
     * Whether the filters on the timemodel should be ignored when grouping data
     * @type {boolean}
     * @private
     */
    this.forceAllData_ = false;

    /**
     * The sorting function
     * @type {?osHistoBin.SortFn}
     * @protected
     */
    this.sortFn = null;

    /**
     * Track when reindex is needed and only do it once; immediately before updating results
     * @type {boolean}
     * @private
     */
    this.reindexFlag_ = false;

    /**
     * Update event delay
     * @type {Delay}
     * @private
     */
    this.updateDelay_ = new Delay(this.onUpdate, 25, this);

    /**
     * Map of feature uuid to the current feature bin.
     * @type {!Object<(string|number), !ColorBin>}
     * @private
     */
    this.featureBins_ = {};

    this.listenKey_ = null;

    dispatcher.getInstance().listen(FeatureEventType.COLOR, this.onFeatureColor_, false, this);

    // link to the parent histogram
    this.setParent(opt_parent || null);

    // trigger a feature refresh
    this.update();
  }

  /**
   * @inheritDoc
   */
  dispose() {
    this.refCount_--;

    if (this.refCount_ <= 0) {
      log.fine(this.log, 'Disposing histogram ' + this.id_ + '.');
      super.dispose();
    } else {
      log.fine(this.log, 'Skipping histogram dispose for id = ' + this.id_ +
          ' (ref count = ' + this.refCount_ + ')');
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispatcher.getInstance().unlisten(FeatureEventType.COLOR, this.onFeatureColor_, false, this);

    this.setParent(null);
    this.source = null;

    this.updateDelay_.dispose();
    this.updateDelay_ = null;

    this.setBinMethod(null);
    this.setSecondaryBinMethod(null);

    this.results.length = 0;

    this.timeModel_.removeDimension(this.id_);
    this.timeModel_.removeDimension(this.multiId_);
  }

  /**
   * Increment the reference count by one.
   * reference.
   */
  incrementRefCount() {
    this.refCount_++;
  }

  /**
   * Decrement the reference count by one, disposing of the histogram if the count reaches zero.
   */
  decrementRefCount() {
    this.refCount_--;

    if (this.refCount_ <= 0) {
      this.dispose();
    }
  }

  /**
   * Fires a change event when the histogram changes.
   *
   * @protected
   */
  onDataChange() {
    for (var key in this.featureBins_) {
      var bin = this.featureBins_[key];
      if (bin) {
        bin.clear();
      }
    }

    this.featureBins_ = {};

    this.updateResults();
    this.dispatchEvent(GoogEventType.CHANGE);
  }

  /**
   * Get the histogram id.
   *
   * @return {string}
   */
  getId() {
    return this.id_;
  }

  /**
   * Get the 2D histogram id.
   *
   * @return {string}
   */
  getMultiId() {
    return this.multiId_;
  }

  /**
   * @inheritDoc
   */
  getName() {
    return this.name;
  }

  /**
   * @inheritDoc
   */
  setName(value) {
    this.name = value;
  }

  /**
   * Get the cascaded values for this histogram.
   *
   * @return {Array<*>}
   */
  getCascadeValues() {
    return this.cascadeValues_;
  }

  /**
   * Set the cascaded values for this histogram.
   *
   * @param {Array<*>} value
   */
  setCascadeValues(value) {
    // Don't trigger everything re-rendering (usually again) if swapping from null to null;
    // NOTE: Visible code that calls this are passing in a new Array with the old items, so the
    // event will still be thrown and all listeners triggered.  It would be more accurate to
    // run an item-by-item comparison, but that's too slow
    if (this.cascadeValues_ != value) {
      this.cascadeValues_ = value;

      // notify cascaded histograms they need to update
      this.dispatchEvent(HistoEventType.CASCADE_CHANGE);
    }
  }

  /**
   * Get the parent of this histogram.
   *
   * @return {SourceHistogram}
   */
  getParent() {
    return this.parent_;
  }

  /**
   * Set the parent of this histogram.
   *
   * @param {SourceHistogram} value
   */
  setParent(value) {
    if (this.parent_) {
      // remove parent listeners
      this.parent_.unlisten(GoogEventType.CHANGE, this.update, false, this);
      this.parent_.unlisten(HistoEventType.CASCADE_CHANGE, this.update, false, this);
      this.parent_.decrementRefCount();
    } else {
      // no parent - remove source listeners
      unlistenByKey(this.listenKey_);
    }

    this.parent_ = value;

    if (!this.isDisposed()) {
      if (this.parent_) {
        // update when the parent histogram changes
        this.parent_.listen(GoogEventType.CHANGE, this.update, false, this);
        this.parent_.listen(HistoEventType.CASCADE_CHANGE, this.update, false, this);
        this.parent_.incrementRefCount();
      } else {
        // no parent - update when the source changes
        this.listenKey_ = listen(this.source, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getBinMethod() {
    return this.binMethod;
  }

  /**
   * Get the secondary bin method.
   *
   * @return {IBinMethod<Feature>}
   */
  getSecondaryBinMethod() {
    return this.secondaryBinMethod;
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setBinMethod(method) {
    // clone to the local context to prevent leaks
    this.binMethod = osHisto.cloneMethod(method);

    if (this.binMethod) {
      if (this.binMethod.getValueFunction() == null) {
        this.binMethod.setValueFunction(osFeature.getField);
      }
      this.binRanges_ = this.binMethod.getArrayKeys() || false;
    }

    this.reindexFlag_ = true;
    this.update(100);
    this.dispatchEvent(HistoEventType.BIN_CHANGE);
  }

  /**
   * Sets the secondary bin method.
   *
   * @param {IBinMethod<Feature>} method
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setSecondaryBinMethod(method) {
    // clone to the local context to prevent leaks
    this.secondaryBinMethod = osHisto.cloneMethod(method);

    if (this.secondaryBinMethod) {
      if (this.secondaryBinMethod.getValueFunction() == null) {
        this.secondaryBinMethod.setValueFunction(osFeature.getField);
      }

      /**
       * Do the binning for each dimension to create a xf key that represents the bins that would contain the item
       *
       * @param {Feature} item
       * @return {string}
       */
      this.combinedAccessor = function(item) {
        return this.binMethod.getBinKey(this.binMethod.getValue(item)).toString() + DataModel.SEPARATOR +
          this.secondaryBinMethod.getBinKey(this.secondaryBinMethod.getValue(item)).toString();
      };

      /**
       * Warning: returning anything but the xf key may result in unexpected binning as the order in xf for the accessor
       * and this key grouping method must be the same
       *
       * @param {string} key
       * @return {string}
       */
      this.combinedKeyMethod = function(key) {
        return key;
      };
    } else {
      // no method provided; remove the current one
      this.secondaryBinMethod = null;
      this.combinedAccessor = null;
      this.combinedKeyMethod = null;
    }

    this.reindexFlag_ = true;
    this.update(100);
    this.dispatchEvent(HistoEventType.BIN_CHANGE);
  }

  /**
   * Re-index data in the time model.
   *
   * @protected
   */
  reindex() {
    this.reindexFlag_ = false;

    if (this.timeModel_) {
      this.timeModel_.removeDimension(this.id_);

      if (this.binMethod) {
        var valueFn = this.binMethod.getValue.bind(this.binMethod);
        // add dimension that will handle an array of keys
        var isArray = this.binMethod.getBinType() == 'Date' ?
          DateRangeBinType[/** @type {DateBinMethod} */ (this.binMethod).getDateBinType()] : false;
        isArray = this.binRanges_ ? isArray : false;
        this.timeModel_.addDimension(this.id_, valueFn, isArray);

        if (this.secondaryBinMethod) {
          this.timeModel_.addDimension(this.multiId_, this.combinedAccessor.bind(this), isArray);
        } else {
          this.timeModel_.removeDimension(this.multiId_);
        }
      }
    }
  }

  /**
   * Get the sorting function
   *
   * @return {?osHistoBin.SortFn}
   */
  getSortFn() {
    return this.sortFn;
  }

  /**
   * Set the sorting function
   *
   * @param {?osHistoBin.SortFn} sortFn
   */
  setSortFn(sortFn) {
    this.sortFn = sortFn;
    this.update(100);
  }

  /**
   * Get the filters to apply to parent histogram dimensions.
   *
   * @return {(Object<string, function(*):boolean>|undefined)}
   * @protected
   */
  getParentFilters() {
    var filters;
    var current = this.getParent();
    while (current) {
      var method = current.getBinMethod();
      var id = current.getId();
      if (method) {
        var values = current.getCascadeValues() || [];
        filters = filters || {};
        filters[id] = method.createFilter(values);
      } else {
        // one of the parents isn't configured, so this histogram shouldn't return results. an undefined filter will be
        // treated as a "return nothing" indicator in getResults.
        filters = {};
        filters[id] = undefined;
        break;
      }

      current = current.getParent();
    }

    return filters;
  }

  /**
   * Get the results
   *
   * @return {!Array<!ColorBin>}
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  getResults() {
    return this.results;
  }

  /**
   * Update results from crossfilter.
   */
  updateResults() {
    if (this.reindexFlag_) {
      this.reindex();
    }

    var results = [];
    if (this.timeModel_ && this.binMethod) {
      // make sure the source time model is filtered on the correct range
      if (this.source) {
        this.source.getFilteredFeatures();
      }

      var tempFilters = {};
      var filters = this.getParentFilters();
      if (filters) {
        for (var id in filters) {
          if (filters[id] != null) {
            this.timeModel_.filterDimension(id, filters[id]);
          } else {
            // there's a disturbance in the force - don't return any bins! see getParentFilters for details.
            this.results = [];
            return;
          }
        }
      }

      // clear the filters to get all of the data, reapply them a little farther down
      if (this.forceAllData_ == true) {
        tempFilters = this.timeModel_.clearAllFilters();
      }

      if (this.secondaryBinMethod) {
        results = /** @type {!Array<!Result<!Feature>>} */ (this.timeModel_.groupData(this.multiId_,
            this.combinedKeyMethod.bind(this), this.reduceAdd.bind(this),
            this.reduceRemove.bind(this), this.reduceInit.bind(this)));
      } else {
        results = /** @type {!Array<!Result<!Feature>>} */ (this.timeModel_.groupData(this.id_,
            this.binMethod.getBinKey.bind(this.binMethod), this.reduceAdd.bind(this),
            this.reduceRemove.bind(this), this.reduceInit.bind(this)));
      }

      // reapply the filters
      if (this.source && this.forceAllData_ == true) {
        this.timeModel_.applyFilters(tempFilters);
      }

      if (filters) {
        for (var id in filters) {
          this.timeModel_.filterDimension(id, undefined);
        }
      }


      results = /** @type {!Array<!ColorBin>} */ (results.map(this.map, this).filter(function(item) {
        return item != undefined;
      }));

      if (this.sortFn) {
        googArray.sort(results, this.sortFn);
      }
    }

    this.results = results;
  }

  /**
   * @param {!Result<!Feature>} item
   * @param {number} i
   * @param {!Array<!Result<!Feature>>} arr
   * @return {ColorBin}
   * @protected
   */
  map(item, i, arr) {
    var bin = /** @type {!ColorBin} */ (item.value);
    var items = bin.getItems();

    if (!items || !items.length) {
      return null;
    }

    bin.setKey(item.key);

    if (this.secondaryBinMethod) {
      bin.setLabel(this.binMethod.getLabelForKey(item.key, false, true) + DataModel.SEPARATOR +
        this.secondaryBinMethod.getLabelForKey(item.key, true, true));
    } else {
      bin.setLabel(this.binMethod.getLabelForKey(item.key));
    }

    return bin;
  }

  /**
   * Set the data color method on the source.
   *
   * @param {ColorMethod} value
   * @param {Array<!ColorBin>=} opt_bins The bins to color, for manual color
   * @param {string=} opt_color The manual color
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setColorMethod(value, opt_bins, opt_color) {
    if (this.source) {
      var colorModel = this.source.getColorModel();
      if (value > 0) {
        var set = !colorModel || (colorModel.getHistogram() != this);

        if (set) {
          colorModel = this.source.createColorModel(this);
        }

        colorModel.setColorMethod(value, opt_bins, opt_color);

        if (set) {
          this.source.setColorModel(colorModel);
        }
      } else {
        if (colorModel != null) {
          colorModel.setColorMethod(value, opt_bins, opt_color);
        }
        this.source.setColorModel(null);
      }
    }
  }

  /**
   * Get the source for this histogram.
   *
   * @return {Vector}
   */
  getSource() {
    return this.source;
  }

  /**
   * Handles change events on the source
   *
   * @param {PropertyChangeEvent} e
   * @private
   */
  onSourceChange_(e) {
    var p = e.getProperty();
    if (p === PropertyChange.COLOR || p === PropertyChange.FEATURES ||
        p === PropertyChange.REPLACE_STYLE || p === PropertyChange.TIME_ENABLED ||
        p === PropertyChange.COLOR_MODEL) {
      this.update(100);
    } else if (p === PropertyChange.FEATURE_VISIBILITY && !this.forceAllData_) {
      // increase the delay to rate limit updates triggered by the timeline
      this.update(100);
    } else if (p === PropertyChange.TIME_FILTER) {
      // call this to force the time range intersection to update
      this.source.getFilteredFeatures();
      this.update();
    } else if (p === PropertyChange.DATA) {
      // existing data changed, so reindex crossfilter before updating
      this.reindexFlag_ = true;
      this.update(100);
    }
  }

  /**
   * Triggers an update of the data.
   *
   * @param {number=} opt_delay Delay in milliseconds, to override the default value
   * @protected
   */
  update(opt_delay) {
    if (this.updateDelay_) {
      this.updateDelay_.start(opt_delay);
    }
  }

  /**
   * Updates and colors the data in the histogram.
   *
   * @param {GoogEvent=} opt_e
   * @protected
   */
  onUpdate(opt_e) {
    this.onDataChange();
  }

  /**
   * @inheritDoc
   * @suppress {checkTypes} To allow [] access on features.
   */
  reduceAdd(bin, item) {
    // add bin mapping for color sync
    this.featureBins_[item['id']] = bin;
    bin.addItem(item);
    return bin;
  }

  /**
   * @inheritDoc
   * @suppress {checkTypes} To allow [] access on features.
   */
  reduceRemove(bin, item) {
    // remove bin mapping used for color sync
    this.featureBins_[item['id']] = undefined;
    bin.removeItem(item);
    return bin;
  }

  /**
   * @inheritDoc
   */
  reduceInit() {
    var bin = new ColorBin(this.source.getColor());
    bin.setColorFunction(function(item) {
      return /** @type {string|undefined} */ (osFeature.getColor(/** @type {!Feature} */ (item)));
    });
    return bin;
  }

  /**
   * @param {FeatureEvent} event The event
   * @private
   */
  onFeatureColor_(event) {
    if (event.id && this.featureBins_[event.id]) {
      this.featureBins_[event.id].decrementColor(/** @type {string|undefined} */ (event.oldVal));
      this.featureBins_[event.id].incrementColor(/** @type {string|undefined} */ (event.newVal));
    }
  }

  /**
   * @param {string|number} id The feature id
   * @return {ColorBin}
   */
  getBinByFeatureId(id) {
    return this.featureBins_[id] || null;
  }

  /**
   * @param {boolean} value The value
   */
  setBinRanges(value) {
    this.binRanges_ = value;
    if (this.binMethod && this.binMethod.getBinType() == 'Date' &&
        DateRangeBinType[/** @type {DateBinMethod} */ (this.binMethod).getDateBinType()]) {
      this.binMethod.setArrayKeys(value);
    }

    this.reindexFlag_ = true;
    this.update(100);
    this.dispatchEvent(GoogEventType.CHANGE);
  }

  /**
   * @return {boolean} the value
   */
  getBinRanges() {
    return this.binRanges_;
  }

  /**
   * @param {boolean} value The value
   */
  setForceAllData(value) {
    this.forceAllData_ = value;
  }

  /**
   * @return {boolean} the value
   */
  getForceAllData() {
    return this.forceAllData_;
  }
}

/**
 * Logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('os.data.histo.SourceHistogram');


/**
 * Base identifier fro source histograms.
 * @type {string}
 * @const
 */
SourceHistogram.ID = 'sourcehisto';


/**
 * Global id counter for source histograms. Ensures they all have unique id's.
 * @type {number}
 */
SourceHistogram.nextId = 0;
