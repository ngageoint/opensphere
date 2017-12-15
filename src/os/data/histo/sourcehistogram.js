goog.provide('os.data.histo.SourceHistogram');

goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('ol.events');
goog.require('os.data.FeatureEvent');
goog.require('os.data.FeatureEventType');
goog.require('os.data.histo');
goog.require('os.data.histo.ColorBin');
goog.require('os.data.histo.ColorMethod');
goog.require('os.data.histo.ColorModel');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.histo.BinMethod');
goog.require('os.histo.bin');
goog.require('os.source.PropertyChange');



/**
 * Histogram with cascade support.
 *
 * Do not instantiate this directly! Please use {@link os.source.Vector#createHistogram} to make sure the model is
 * created in the same window context as the source.
 *
 * @param {os.source.Vector} source The source for the histogram
 * @param {os.data.histo.SourceHistogram=} opt_parent Parent histogram for cascading
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.data.histo.SourceHistogram = function(source, opt_parent) {
  os.data.histo.SourceHistogram.base(this, 'constructor');

  /**
   * Unique identifier for the source histogram.
   * @type {string}
   * @private
   */
  this.id_ = os.data.histo.SourceHistogram.ID + os.data.histo.SourceHistogram.nextId++;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.data.histo.SourceHistogram.LOGGER_;

  /**
   * Count how many objects are referring to the histogram to prevent premature disposal.
   * @type {number}
   * @private
   */
  this.refCount_ = 0;

  /**
   * @type {?os.histo.IBinMethod<ol.Feature>}
   * @protected
   */
  this.binMethod = null;

  /**
   * The source for the histogram
   * @type {os.source.Vector}
   * @protected
   */
  this.source = source;

  /**
   * The latest histogram results.
   * @type {!Array<!os.data.histo.ColorBin>}
   * @protected
   */
  this.results = [];

  /**
   * The parent histogram for cascading results
   * @type {os.data.histo.SourceHistogram}
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
   * @type {os.time.xf.TimeModel}
   * @private
   */
  this.timeModel_ = source.getTimeModel();

  /**
   * The sorting function
   * @type {?os.histo.bin.SortFn}
   * @protected
   */
  this.sortFn = null;

  /**
   * Update event delay
   * @type {goog.async.Delay}
   * @private
   */
  this.updateDelay_ = new goog.async.Delay(this.onUpdate, 25, this);

  /**
   * Map of feature uuid to the current feature bin.
   * @type {!Object<(string|number), !os.data.histo.ColorBin>}
   * @private
   */
  this.featureBins_ = {};

  os.dispatcher.listen(os.data.FeatureEventType.COLOR, this.onFeatureColor_, false, this);

  // link to the parent histogram
  this.setParent(opt_parent || null);

  // trigger a feature refresh
  this.update();
};
goog.inherits(os.data.histo.SourceHistogram, goog.events.EventTarget);


/**
 * Logger for os.data.histo.SourceHistogram
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.histo.SourceHistogram.LOGGER_ = goog.log.getLogger('os.data.histo.SourceHistogram');


/**
 * Base identifier fro source histograms.
 * @type {string}
 * @const
 */
os.data.histo.SourceHistogram.ID = 'sourcehisto';


/**
 * Global id counter for source histograms. Ensures they all have unique id's.
 * @type {number}
 */
os.data.histo.SourceHistogram.nextId = 0;


/**
 * @inheritDoc
 */
os.data.histo.SourceHistogram.prototype.dispose = function() {
  this.refCount_--;

  if (this.refCount_ <= 0) {
    goog.log.fine(this.log, 'Disposing histogram ' + this.id_ + '.');
    os.data.histo.SourceHistogram.base(this, 'dispose');
  } else {
    goog.log.fine(this.log, 'Skipping histogram dispose for id = ' + this.id_ +
        ' (ref count = ' + this.refCount_ + ')');
  }
};


/**
 * @inheritDoc
 */
os.data.histo.SourceHistogram.prototype.disposeInternal = function() {
  os.data.histo.SourceHistogram.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.data.FeatureEventType.COLOR, this.onFeatureColor_, false, this);

  this.setParent(null);
  this.source = null;

  this.updateDelay_.dispose();
  this.updateDelay_ = null;

  this.setBinMethod(null);

  this.results.length = 0;
};


/**
 * Increment the reference count by one.
 * reference.
 */
os.data.histo.SourceHistogram.prototype.incrementRefCount = function() {
  this.refCount_++;
};


/**
 * Decrement the reference count by one, disposing of the histogram if the count reaches zero.
 */
os.data.histo.SourceHistogram.prototype.decrementRefCount = function() {
  this.refCount_--;

  if (this.refCount_ <= 0) {
    this.dispose();
  }
};


/**
 * Fires a change event when the histogram changes.
 * @protected
 */
os.data.histo.SourceHistogram.prototype.onDataChange = function() {
  for (var key in this.featureBins_) {
    var bin = this.featureBins_[key];
    if (bin) {
      bin.clear();
    }
  }

  this.featureBins_ = {};

  this.updateResults();
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * Get the histogram id.
 * @return {string}
 */
os.data.histo.SourceHistogram.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the cascaded values for this histogram.
 * @return {Array<*>}
 */
os.data.histo.SourceHistogram.prototype.getCascadeValues = function() {
  return this.cascadeValues_;
};


/**
 * Set the cascaded values for this histogram.
 * @param {Array<*>} value
 */
os.data.histo.SourceHistogram.prototype.setCascadeValues = function(value) {
  this.cascadeValues_ = value;

  // notify cascaded histograms they need to update
  this.dispatchEvent(os.data.histo.HistoEventType.CASCADE_CHANGE);
};


/**
 * Get the parent of this histogram.
 * @return {os.data.histo.SourceHistogram}
 */
os.data.histo.SourceHistogram.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Set the parent of this histogram.
 * @param {os.data.histo.SourceHistogram} value
 */
os.data.histo.SourceHistogram.prototype.setParent = function(value) {
  if (this.parent_) {
    // remove parent listeners
    this.parent_.unlisten(goog.events.EventType.CHANGE, this.update, false, this);
    this.parent_.unlisten(os.data.histo.HistoEventType.CASCADE_CHANGE, this.update, false, this);
    this.parent_.decrementRefCount();
  } else {
    // no parent - remove source listeners
    ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }

  this.parent_ = value;

  if (!this.isDisposed()) {
    if (this.parent_) {
      // update when the parent histogram changes
      this.parent_.listen(goog.events.EventType.CHANGE, this.update, false, this);
      this.parent_.listen(os.data.histo.HistoEventType.CASCADE_CHANGE, this.update, false, this);
      this.parent_.incrementRefCount();
    } else {
      // no parent - update when the source changes
      ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }
  }
};


/**
 * Get the bin method.
 * @return {os.histo.IBinMethod<ol.Feature>}
 */
os.data.histo.SourceHistogram.prototype.getBinMethod = function() {
  return this.binMethod;
};


/**
 * Sets the bin method.
 * @param {os.histo.IBinMethod<ol.Feature>} method
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.data.histo.SourceHistogram.prototype.setBinMethod = function(method) {
  // clone to the local context to prevent leaks
  this.binMethod = os.histo.cloneMethod(method);

  if (this.binMethod) {
    this.binMethod.setValueFunction(os.feature.getField);
  }

  this.reindex();
  this.update();
  this.dispatchEvent(os.data.histo.HistoEventType.BIN_CHANGE);
};


/**
 * Re-index data in the time model.
 * @protected
 */
os.data.histo.SourceHistogram.prototype.reindex = function() {
  if (this.timeModel_) {
    this.timeModel_.removeDimension(this.id_);

    if (this.binMethod) {
      var valueFn = this.binMethod.getValue.bind(this.binMethod);
      this.timeModel_.addDimension(this.id_, valueFn);
    }
  }
};


/**
 * Get the sorting function
 * @return {?os.histo.bin.SortFn}
 */
os.data.histo.SourceHistogram.prototype.getSortFn = function() {
  return this.sortFn;
};


/**
 * Set the sorting function
 * @param {?os.histo.bin.SortFn} sortFn
 */
os.data.histo.SourceHistogram.prototype.setSortFn = function(sortFn) {
  this.sortFn = sortFn;
  this.update();
};


/**
 * Get the filters to apply to parent histogram dimensions.
 * @return {(Object<string, function(*):boolean>|undefined)}
 * @protected
 */
os.data.histo.SourceHistogram.prototype.getParentFilters = function() {
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
};


/**
 * Get the results
 * @return {!Array<!os.data.histo.ColorBin>}
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.data.histo.SourceHistogram.prototype.getResults = function() {
  return this.results;
};


/**
 * Update results from crossfilter.
 * @protected
 */
os.data.histo.SourceHistogram.prototype.updateResults = function() {
  var results = [];
  if (this.timeModel_ && this.binMethod) {
    // make sure the source time model is filtered on the correct range
    if (this.source) {
      this.source.getFilteredFeatures();
    }

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

    results = /** @type {!Array<!os.histo.Result<!ol.Feature>>} */ (this.timeModel_.groupData(this.id_,
        this.binMethod.getBinKey.bind(this.binMethod), this.reduceAdd.bind(this),
        this.reduceRemove.bind(this), this.reduceInit.bind(this)));

    if (filters) {
      for (var id in filters) {
        this.timeModel_.filterDimension(id, undefined);
      }
    }

    results = /** @type {!Array<!os.data.histo.ColorBin>} */ (results.map(this.map, this).filter(function(item) {
      return item != undefined;
    }));

    if (this.sortFn) {
      goog.array.sort(results, this.sortFn);
    }
  }

  this.results = results;
};


/**
 * @param {!os.histo.Result<!ol.Feature>} item
 * @param {number} i
 * @param {!Array<!os.histo.Result<!ol.Feature>>} arr
 * @return {os.data.histo.ColorBin}
 * @protected
 */
os.data.histo.SourceHistogram.prototype.map = function(item, i, arr) {
  var bin = /** @type {!os.data.histo.ColorBin} */ (item.value);
  var items = bin.getItems();

  if (items && items.length > 0) {
    var thing = items[0];
    bin.setKey(this.binMethod.getBinKey(this.binMethod.getValue(thing)));
    bin.setLabel(this.binMethod.getBinLabel(thing));
  } else {
    // exclude empty bins
    bin = null;
  }

  return bin;
};


/**
 * Set the data color method on the source.
 * @param {os.data.histo.ColorMethod} value
 * @param {Array<!os.data.histo.ColorBin>=} opt_bins The bins to color, for manual color
 * @param {string=} opt_color The manual color
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.data.histo.SourceHistogram.prototype.setColorMethod = function(value, opt_bins, opt_color) {
  if (this.source) {
    var colorModel = this.source.getColorModel();
    if (value > 0) {
      var oldBinColors = {};
      if (colorModel) {
        oldBinColors = colorModel.getBinColors();
      }

      if (!colorModel || colorModel.getHistogram() != this) {
        colorModel = this.source.createColorModel(this);
        this.source.setColorModel(colorModel);
        // we switched data sources, keep the old bin colors before assigning something new
        colorModel.setManualBinColors(oldBinColors);
      }

      colorModel.setColorMethod(value, opt_bins, opt_color);
    } else {
      colorModel.setColorMethod(value, opt_bins, opt_color);
      this.source.setColorModel(null);
    }
  }
};


/**
 * Get the source for this histogram.
 * @return {os.source.Vector}
 */
os.data.histo.SourceHistogram.prototype.getSource = function() {
  return this.source;
};


/**
 * Handles change events on the source
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.data.histo.SourceHistogram.prototype.onSourceChange_ = function(e) {
  var p = e.getProperty();
  if (p === os.source.PropertyChange.COLOR || p === os.source.PropertyChange.FEATURES ||
      p === os.source.PropertyChange.REPLACE_STYLE || p === os.source.PropertyChange.TIME_ENABLED) {
    this.update();
  } else if (p === os.source.PropertyChange.FEATURE_VISIBILITY) {
    // increase the delay to rate limit updates triggered by the timeline
    this.update(100);
  } else if (p === os.source.PropertyChange.TIME_FILTER) {
    // call this to force the time range intersection to update
    this.source.getFilteredFeatures();
    this.update();
  } else if (p === os.source.PropertyChange.DATA) {
    // existing data changed, so reindex crossfilter before updating
    this.reindex();
    this.update();
  }
};


/**
 * Triggers an update of the data.
 * @param {number=} opt_delay Delay in milliseconds, to override the default value
 * @protected
 */
os.data.histo.SourceHistogram.prototype.update = function(opt_delay) {
  if (this.updateDelay_) {
    this.updateDelay_.start(opt_delay);
  }
};


/**
 * Updates and colors the data in the histogram.
 * @param {goog.events.Event=} opt_e
 * @protected
 */
os.data.histo.SourceHistogram.prototype.onUpdate = function(opt_e) {
  this.onDataChange();
};


/**
 * This runs when an item is added to a group
 * @param {!os.data.histo.ColorBin} bin
 * @param {!ol.Feature} item
 * @return {!os.data.histo.ColorBin}
 * @protected
 *
 * @suppress {checkTypes} To allow [] access on features.
 */
os.data.histo.SourceHistogram.prototype.reduceAdd = function(bin, item) {
  // add bin mapping for color sync
  this.featureBins_[item['id']] = bin;
  bin.addItem(item);
  return bin;
};


/**
 * This runs when an item is removed from a group
 * @param {!os.data.histo.ColorBin} bin
 * @param {!ol.Feature} item
 * @return {!os.data.histo.ColorBin}
 * @protected
 *
 * @suppress {checkTypes} To allow [] access on features.
 */
os.data.histo.SourceHistogram.prototype.reduceRemove = function(bin, item) {
  // remove bin mapping used for color sync
  this.featureBins_[item['id']] = undefined;
  bin.removeItem(item);
  return bin;
};


/**
 * Creates a new bin for a group
 * @return {!os.data.histo.ColorBin}
 * @protected
 */
os.data.histo.SourceHistogram.prototype.reduceInit = function() {
  return new os.data.histo.ColorBin(this.source.getColor());
};


/**
 * @param {os.data.FeatureEvent} event The event
 * @private
 */
os.data.histo.SourceHistogram.prototype.onFeatureColor_ = function(event) {
  if (event.id && this.featureBins_[event.id]) {
    this.featureBins_[event.id].decrementColor(/** @type {string|undefined} */ (event.oldVal));
    this.featureBins_[event.id].incrementColor(/** @type {string|undefined} */ (event.newVal));
  }
};
