goog.provide('os.time.xf.TimeModel');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.xf.DataModel');
goog.require('os.data.xf.PropertyChange');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.time.ITime');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


/**
 * Definition for a function that takes an object and returns the time value for that object.
 * @typedef {function(Object):?os.time.ITime}
 */
os.time.xf.GetTimeFn;



/**
 * A time model backed by crossfilter.
 *
 * Note on item removal:
 * A remove function was not included because crossfilter only supports removing the results of the current
 * set of filters. There is no function to remove a specific set of items, so it's much faster to clear the
 * filter and recreate it with the new set of items. Use the setData function to perform both operations
 * at once.
 *
 * @param {os.time.xf.GetTimeFn} getTimeFn
 * @param {?os.time.xf.GetTimeFn=} opt_getHoldTimeFn
 * @extends {os.data.xf.DataModel}
 * @constructor
 * @template T,S,BIN
 */
os.time.xf.TimeModel = function(getTimeFn, opt_getHoldTimeFn) {
  os.time.xf.TimeModel.base(this, 'constructor');

  /**
   * @type {os.time.xf.GetTimeFn}
   * @protected
   */
  this.getTimeFn = getTimeFn;

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.startDimension = this.xf.dimension(this.startFilter_.bind(this, this.getTimeFn));

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.endDimension = this.xf.dimension(this.endFilter_.bind(this, this.getTimeFn));

  /**
   * @type {?crossfilter.XF}
   * @protected
   */
  this.timelessXf = crossfilter();

  /**
   * @type {?crossfilter.XF}
   * @protected
   */
  this.holdsXf = crossfilter();

  /**
   * @type {?os.time.xf.GetTimeFn}
   * @protected
   */
  this.getHoldTimeFn = opt_getHoldTimeFn || null;

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.holdStartDimension = this.getHoldTimeFn ?
      this.holdsXf.dimension(this.startFilter_.bind(this, this.getHoldTimeFn)) : null;

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.holdEndDimension = this.getHoldTimeFn ?
      this.holdsXf.dimension(this.endFilter_.bind(this, this.getHoldTimeFn)) : null;

  /**
   * @type {Object<string, crossfilter.Dimension>}
   * @protected
   */
  this.timelessDimensions = {};

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.defaultDimension = this.timelessXf.dimension(goog.functions.TRUE);

  /**
   * The time range of data loaded in Crossfilter.
   * @type {os.time.TimeRange}
   * @protected
   */
  this.dataRange = null;

  /**
   * The last time range applied to Crossfilter.
   * @type {os.time.TimeRange}
   * @protected
   */
  this.lastRange = null;
};
goog.inherits(os.time.xf.TimeModel, os.data.xf.DataModel);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.time.xf.TimeModel.LOGGER_ = goog.log.getLogger('os.time.xf.TimeModel');


/**
 * Time range used when no time data is loaded.
 * @type {!os.time.TimeRange}
 * @private
 * @const
 */
os.time.xf.TimeModel.EMPTY_RANGE_ = new os.time.TimeRange(NaN, NaN);


/**
 * @override
 */
os.time.xf.TimeModel.prototype.add = function(items) {
  if (!this.isDisposed()) {
    var then = goog.now();

    if (!goog.isArray(items)) {
      items = [items];
    }

    var timeArray = [];
    var noTimeArray = [];
    for (var i = 0, n = items.length; i < n; i++) {
      var item = items[i];
      var time = this.getTimeFn(item);
      if (time && os.implements(time, os.time.ITime.ID)) {
        timeArray.push(item);
      } else {
        noTimeArray.push(item);
      }
    }

    this.xf.add(timeArray);
    this.timelessXf.add(noTimeArray);

    if (this.getHoldTimeFn && os.time.TimelineController.getInstance().hasHoldRanges()) {
      this.holdsXf.add(noTimeArray);
    }

    this.updateRange();

    goog.log.fine(os.time.xf.TimeModel.LOGGER_,
        'Added ' + items.length + ' items to the model in ' + (goog.now() - then) + 'ms.');
  }
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.clear = function() {
  if (!this.isDisposed()) {
    this.startDimension.filterAll();
    this.endDimension.filterAll();

    if (this.holdStartDimension) {
      this.holdStartDimension.filterAll();
    }
    if (this.holdEndDimension) {
      this.holdEndDimension.filterAll();
    }

    for (var key in this.timelessDimensions) {
      this.timelessDimensions[key].filterAll();
    }

    // parent clear must be called after calling filterAll() on each dimension in this class
    os.time.xf.TimeModel.base(this, 'clear');

    this.timelessXf.remove();

    this.holdsXf.remove();

    // reapply previous filter values
    for (var key in this.filterValues) {
      if (this.filterValues[key] != undefined) {
        if (this.dimensions[key] != undefined) {
          this.dimensions[key].filter(this.filterValues[key]);
        }

        if (this.timelessDimensions[key] != undefined) {
          this.timelessDimensions[key].filter(this.filterValues[key]);
        }
      }
    }

    this.updateRange();
  }
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.disposeInternal = function() {
  os.time.xf.TimeModel.base(this, 'disposeInternal');

  // dispose time dimensions
  this.startDimension.dispose();
  this.startDimension = null;
  this.endDimension.dispose();
  this.endDimension = null;

  if (this.holdStartDimension) {
    this.holdStartDimension.dispose();
    this.holdStartDimension = null;
  }

  if (this.holdEndDimension) {
    this.holdEndDimension.dispose();
    this.holdEndDimension = null;
  }

  for (var key in this.timelessDimensions) {
    this.timelessDimensions[key].dispose();
    delete this.timelessDimensions[key];
  }

  // dispose placeholder dimension
  if (this.defaultDimension) {
    this.defaultDimension.dispose();
    this.defaultDimension = null;
  }

  this.timelessXf = null;
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.addDimension = function(id, accessorFn, opt_isArray) {
  if (!this.isDisposed()) {
    this.removeDimension(id, true);

    if (this.defaultDimension) {
      // no previous dimensions, remove the placeholder dimension
      this.defaultDimension.dispose();
      this.defaultDimension = null;
    }

    // add the dimension to the timed data crossfilter
    this.dimensions[id] = this.xf.dimension(accessorFn, opt_isArray);
    // add the dimension to the timeless data crossfilter
    this.timelessDimensions[id] = this.timelessXf.dimension(accessorFn, opt_isArray);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.data.xf.PropertyChange.DIMENSION, id));
  }
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.groupData = function(id, accessorFn, addFn, removeFn, initFn) {
  var results;
  if (!this.isDisposed()) {
    results = os.time.xf.TimeModel.base(this, 'groupData', id, accessorFn, addFn, removeFn, initFn);
    var dimension = this.timelessDimensions[id];
    if (dimension) {
      // timeless data exists, so group it as well
      var groups = this.groupDataInternal(dimension, accessorFn, addFn, removeFn, initFn);

      // merge groups into the set created from data with time, ignore timeless data (no results)
      for (var i = 0, ii = groups.length; i < ii; i++) {
        var group = /** @type {!os.histo.Result} */ (groups[i]);
        var existing = /** @type {os.histo.Result|undefined} */ (goog.array.find(results, function(result) {
          return result['key'] == group['key'];
        }));

        if (existing) {
          // bin already exists, so merge the results
          var existingBin = /** @type {!os.histo.Bin} */ (existing['value']);
          var groupBin = /** @type {!os.histo.Bin} */ (group['value']);
          var items = groupBin.getItems().slice();
          for (var j = 0; j < items.length; j++) {
            var item = items[j];
            removeFn(groupBin, item);
            addFn(existingBin, item);
          }
        } else {
          // bin doesn't exist, so add it to the results
          results.push(group);
        }
      }
    }
  }

  return results || [];
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.hasDimension = function(id) {
  return os.time.xf.TimeModel.base(this, 'hasDimension', id) ||
      (this.timelessDimensions != null && id in this.timelessDimensions);
};


/**
 * Removes a dimension from the model. If all custom dimensions have been removed, the timeless crossfilter will
 * be given a default dimension that can be used to access all timeless data.
 * @param {string} id Unique id of the dimension
 * @param {boolean=} opt_skipDefault If true, skips adding the default dimension to the timeless crossfilter. This
 *    should only be used internally from addDimension or timeless records won't be returned.
 * @override
 */
os.time.xf.TimeModel.prototype.removeDimension = function(id, opt_skipDefault) {
  if (!this.isDisposed()) {
    if (id in this.timelessDimensions) {
      // dimension already existed, so remove the old one
      var old = this.timelessDimensions[id];
      old.dispose();
      delete this.timelessDimensions[id];
    }

    if (!opt_skipDefault && goog.object.isEmpty(this.timelessDimensions) && !this.defaultDimension) {
      this.defaultDimension = this.timelessXf.dimension(goog.functions.TRUE);
    }

    // call the parent last so the above executes before the event is fired.
    os.time.xf.TimeModel.base(this, 'removeDimension', id);
  }
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.filterDimension = function(id, opt_value) {
  if (!this.isDisposed()) {
    if (id in this.timelessDimensions) {
      this.timelessDimensions[id].filter(opt_value);
    }

    os.time.xf.TimeModel.base(this, 'filterDimension', id, opt_value);
  }
};


/**
 * Gets the time range of loaded data.
 * @return {!os.time.TimeRange}
 */
os.time.xf.TimeModel.prototype.getRange = function() {
  return this.dataRange || os.time.xf.TimeModel.EMPTY_RANGE_;
};


/**
 * Gets the last time range used to filter data.
 * @return {os.time.TimeRange}
 */
os.time.xf.TimeModel.prototype.getLastRange = function() {
  return this.lastRange;
};


/**
 * Updates the time range of loaded data.
 * @protected
 */
os.time.xf.TimeModel.prototype.updateRange = function() {
  this.dataRange = null;

  if (!this.isDisposed() && this.xf && this.xf.size() > 0) {
    this.startDimension.filterAll();
    this.endDimension.filterAll();

    var bottom = this.startDimension.bottom(1);
    var start = bottom.length > 0 ? this.getTimeFn(bottom[0]).getStart() : NaN;

    var top = this.endDimension.top(1);
    var end = top.length > 0 ? this.getTimeFn(top[0]).getEnd() : NaN;

    this.dataRange = new os.time.TimeRange(start, end);

    if (this.lastRange) {
      this.intersection(this.lastRange, false, false);
    }
  }
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.getSize = function() {
  return (this.xf ? this.xf.size() : 0) + (this.timelessXf ? this.timelessXf.size() : 0);
};


/**
 * Get items intersecting the provided time range.
 * @param {os.time.TimeRange} range
 * @param {boolean=} opt_includeTimeless If timeless records should be included in the intersection. Defaults to false.
 * @param {boolean=} opt_includeHolds If hold records should be included in the intersection. Defaults to false.
 * @return {Array<Object>}
 */
os.time.xf.TimeModel.prototype.intersection = function(range, opt_includeTimeless, opt_includeHolds) {
  var results;

  if (!this.isDisposed()) {
    // Hack Alert!
    // crossfilter will exclude anything matching the end value, so if start and end are the same
    // anything equal to them is technically intersecting so we need to increment end by 1 to make
    // sure those data points are matched.
    var start = range.getStart();
    var end = range.getEnd();
    if (start == end) {
      end++;
    }

    this.startDimension.filter([-Infinity, end]);
    this.endDimension.filter([start, Infinity]);

    results = this.startDimension.top(Infinity);

    if (opt_includeTimeless) {
      if (this.defaultDimension) {
        results = results.concat(this.defaultDimension.top(Infinity));
      } else {
        var dim = goog.object.getAnyValue(this.timelessDimensions);
        results = results.concat(dim.top(Infinity));
      }
    }

    if (!opt_includeTimeless && opt_includeHolds) {
      // if the holdStartDimension/holdEndDimension are defined, append those results.
      if (this.holdEndDimension && this.holdStartDimension) {
        this.holdStartDimension.filter([-Infinity, end]);
        this.holdEndDimension.filter([start, Infinity]);
        results = results.concat(this.holdStartDimension.top(Infinity));
      }
    }

    if (this.filterFunction) {
      results = goog.array.filter(results, this.filterFunction, this);
    }

    this.lastRange = range;
  }

  return results || [];
};


/**
 * @inheritDoc
 */
os.time.xf.TimeModel.prototype.isEmpty = function() {
  return (!this.xf || this.xf.size() <= 0) && (!this.timelessXf || this.timelessXf.size() <= 0);
};


/**
 * Function to retrieve the start time for an object.
 * @param {os.time.xf.GetTimeFn} accessorFn
 * @param {Object} item
 * @return {number}
 * @private
 *
 * @todo THIN-6569 Handle NaN time value.
 */
os.time.xf.TimeModel.prototype.startFilter_ = function(accessorFn, item) {
  var result = os.time.TimeInstant.MIN_TIME;
  var time = accessorFn(item);
  if (time) {
    result = time.getStart();
  }
  return result;
};


/**
 * Function to retrieve the end time for an object.
 * @param {os.time.xf.GetTimeFn} accessorFn
 * @param {Object} item
 * @return {number}
 * @private
 *
 * @todo THIN-6569 Handle NaN time value.
 */
os.time.xf.TimeModel.prototype.endFilter_ = function(accessorFn, item) {
  var result = os.time.TimeInstant.MAX_TIME;
  var time = accessorFn(item);
  if (time) {
    result = time.getEnd();
  }
  return result;
};
