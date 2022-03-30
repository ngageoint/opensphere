goog.declareModuleId('os.time.xf.TimeModel');

import {find} from 'ol/src/array.js';

import DataModel from '../../data/xf/datamodel.js';
import PropertyChange from '../../data/xf/propertychange.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import osImplements from '../../implements.js';
import ITime from '../itime.js';
import TimeInstant from '../timeinstant.js';
import TimelineController from '../timelinecontroller.js';
import TimeRange from '../timerange.js';

const googArray = goog.require('goog.array');
const functions = goog.require('goog.functions');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');
const {default: Bin} = goog.requireType('os.histo.Bin');
const {default: Result} = goog.requireType('os.histo.Result');
const {GetTimeFn} = goog.requireType('os.time.xf');


/**
 * A time model backed by crossfilter.
 *
 * Note on item removal:
 * A remove function was not included because crossfilter only supports removing the results of the current
 * set of filters. There is no function to remove a specific set of items, so it's much faster to clear the
 * filter and recreate it with the new set of items. Use the setData function to perform both operations
 * at once.
 *
 * @template T,S,BIN
 */
export default class TimeModel extends DataModel {
  /**
   * Constructor.
   * @param {GetTimeFn} getTimeFn
   * @param {?GetTimeFn=} opt_getHoldTimeFn
   */
  constructor(getTimeFn, opt_getHoldTimeFn) {
    super();

    /**
     * @type {GetTimeFn}
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
     * @type {?GetTimeFn}
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
    this.defaultDimension = this.timelessXf.dimension(functions.TRUE);

    /**
     * The time range of data loaded in Crossfilter.
     * @type {TimeRange}
     * @protected
     */
    this.dataRange = null;

    /**
     * The last time range applied to Crossfilter.
     * @type {TimeRange}
     * @protected
     */
    this.lastRange = null;
  }

  /**
   * @override
   */
  add(items) {
    if (!this.isDisposed()) {
      var then = Date.now();

      if (!Array.isArray(items)) {
        items = [items];
      }

      var timeArray = [];
      var noTimeArray = [];
      for (var i = 0, n = items.length; i < n; i++) {
        var item = items[i];
        var time = this.getTimeFn(item);
        if (time && osImplements(time, ITime.ID)) {
          timeArray.push(item);
        } else {
          noTimeArray.push(item);
        }
      }

      this.xf.add(timeArray);
      this.timelessXf.add(noTimeArray);

      if (this.getHoldTimeFn && TimelineController.getInstance().hasHoldRanges()) {
        this.holdsXf.add(noTimeArray);
      }

      this.updateRange();

      log.fine(logger,
          'Added ' + items.length + ' items to the model in ' + (Date.now() - then) + 'ms.');
    }
  }

  /**
   * @inheritDoc
   */
  clear() {
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
      super.clear();

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

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
  }

  /**
   * @inheritDoc
   */
  addDimension(id, accessorFn, opt_isArray) {
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

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.DIMENSION, id));
    }
  }

  /**
   * @inheritDoc
   */
  groupData(id, accessorFn, addFn, removeFn, initFn) {
    var results;
    if (!this.isDisposed()) {
      results = super.groupData(id, accessorFn, addFn, removeFn, initFn);
      var dimension = this.timelessDimensions[id];
      if (dimension) {
        // timeless data exists, so group it as well
        var groups = this.groupDataInternal(dimension, accessorFn, addFn, removeFn, initFn);

        // merge groups into the set created from data with time, ignore timeless data (no results)
        for (var i = 0, ii = groups.length; i < ii; i++) {
          var group = /** @type {!Result} */ (groups[i]);
          var existing = /** @type {Result|undefined} */ (find(results, function(result) {
            return result['key'] == group['key'];
          }));

          if (existing) {
            // bin already exists, so merge the results
            var existingBin = /** @type {!Bin} */ (existing['value']);
            var groupBin = /** @type {!Bin} */ (group['value']);
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
  }

  /**
   * @inheritDoc
   */
  hasDimension(id) {
    return super.hasDimension(id) ||
        (this.timelessDimensions != null && id in this.timelessDimensions);
  }

  /**
   * Removes a dimension from the model. If all custom dimensions have been removed, the timeless crossfilter will
   * be given a default dimension that can be used to access all timeless data.
   *
   * @param {string} id Unique id of the dimension
   * @param {boolean=} opt_skipDefault If true, skips adding the default dimension to the timeless crossfilter. This
   *    should only be used internally from addDimension or timeless records won't be returned.
   * @override
   */
  removeDimension(id, opt_skipDefault) {
    if (!this.isDisposed()) {
      if (id in this.timelessDimensions) {
        // dimension already existed, so remove the old one
        var old = this.timelessDimensions[id];
        old.dispose();
        delete this.timelessDimensions[id];
      }

      if (!opt_skipDefault && googObject.isEmpty(this.timelessDimensions) && !this.defaultDimension) {
        this.defaultDimension = this.timelessXf.dimension(functions.TRUE);
      }

      // call the parent last so the above executes before the event is fired.
      super.removeDimension(id);
    }
  }

  /**
   * @inheritDoc
   */
  filterDimension(id, opt_value) {
    if (!this.isDisposed()) {
      if (id in this.timelessDimensions) {
        this.timelessDimensions[id].filter(opt_value);
      }

      super.filterDimension(id, opt_value);
    }
  }

  /**
   * Gets the time range of loaded data.
   *
   * @return {!TimeRange}
   */
  getRange() {
    return this.dataRange || emptyRange;
  }

  /**
   * Gets the last time range used to filter data.
   *
   * @return {TimeRange}
   */
  getLastRange() {
    return this.lastRange;
  }

  /**
   * Updates the time range of loaded data.
   *
   * @protected
   */
  updateRange() {
    this.dataRange = null;

    if (!this.isDisposed() && this.xf && this.xf.size() > 0) {
      this.startDimension.filterAll();
      this.endDimension.filterAll();

      var bottom = this.startDimension.bottom(1);
      var start = bottom.length > 0 ? this.getTimeFn(bottom[0]).getStart() : NaN;

      var top = this.endDimension.top(1);
      var end = top.length > 0 ? this.getTimeFn(top[0]).getEnd() : NaN;

      this.dataRange = new TimeRange(start, end);

      if (this.lastRange) {
        this.intersection(this.lastRange, false, false);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getSize() {
    return (this.xf ? this.xf.size() : 0) + (this.timelessXf ? this.timelessXf.size() : 0);
  }

  /**
   * Get items intersecting the provided time range.
   *
   * @param {TimeRange} range
   * @param {boolean=} opt_includeTimeless If timeless records should be included in the intersection. Defaults to false.
   * @param {boolean=} opt_includeHolds If hold records should be included in the intersection. Defaults to false.
   * @return {Array<Object>}
   */
  intersection(range, opt_includeTimeless, opt_includeHolds) {
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
          var dim = googObject.getAnyValue(this.timelessDimensions);
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
        results = googArray.filter(results, this.filterFunction, this);
      }

      this.lastRange = range;
    }

    return results || [];
  }

  /**
   * @inheritDoc
   */
  isEmpty() {
    return (!this.xf || this.xf.size() <= 0) && (!this.timelessXf || this.timelessXf.size() <= 0);
  }

  /**
   * Function to retrieve the start time for an object.
   *
   * @param {GetTimeFn} accessorFn
   * @param {Object} item
   * @return {number}
   * @private
   *
   * @todo THIN-6569 Handle NaN time value.
   */
  startFilter_(accessorFn, item) {
    var result = TimeInstant.MIN_TIME;
    var time = accessorFn(item);
    if (time) {
      result = time.getStart();
    }
    return result;
  }

  /**
   * Function to retrieve the end time for an object.
   *
   * @param {GetTimeFn} accessorFn
   * @param {Object} item
   * @return {number}
   * @private
   *
   * @todo THIN-6569 Handle NaN time value.
   */
  endFilter_(accessorFn, item) {
    var result = TimeInstant.MAX_TIME;
    var time = accessorFn(item);
    if (time) {
      result = time.getEnd();
    }
    return result;
  }

  /**
   * @inheritDoc
   */
  getResults(opt_value, opt_dim, opt_bottom) {
    var val = super.getResults(opt_value, opt_dim, opt_bottom);
    if (!(Array.isArray(val) && val.length) && !this.isDisposed()) {
      var dim = opt_dim && this.hasDimension(opt_dim) ?
        this.timelessDimensions[opt_dim] : googObject.getAnyValue(this.timelessDimensions);
      opt_value = opt_value || Infinity;

      if (dim) {
        var results = /** @type {!Array<S>} */ (opt_bottom ? dim.bottom(opt_value) : dim.top(opt_value));

        if (this.filterFunction) {
          results = googArray.filter(results, this.filterFunction, this);
        }

        return results;
      }
    }
    return val;
  }

  /**
   * @inheritDoc
   */
  getDimensionKeys(id) {
    var val = super.getDimensionKeys(id);
    if (!(Array.isArray(val) && val.length) && !this.isDisposed() && this.hasDimension(id)) {
      var group = this.timelessDimensions[id].group();
      var keys = this.timelessDimensions[id].group().all().map(function(v) {
        return v.key;
      });

      // dispose the group
      group.dispose();

      return keys;
    }
    return val;
  }

  /**
   * @inheritDoc
   */
  getTopRecord(id) {
    var val = super.getTopRecord(id);
    if (!val && !this.isDisposed() && this.hasDimension(id)) {
      var topRecord = this.timelessDimensions[id].top(1);
      return topRecord.length == 1 ? topRecord[0] : undefined;
    }
    return val;
  }

  /**
   * @inheritDoc
   */
  getBottomRecord(id) {
    var val = super.getBottomRecord(id);
    if (!val && !this.isDisposed() && this.hasDimension(id)) {
      var bottomRecord = this.timelessDimensions[id].bottom(1);
      return bottomRecord.length == 1 ? bottomRecord[0] : undefined;
    }
    return val;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.time.xf.TimeModel');


/**
 * Time range used when no time data is loaded.
 * @type {!TimeRange}
 */
const emptyRange = new TimeRange(NaN, NaN);
