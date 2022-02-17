goog.declareModuleId('os.data.xf.DataModel');

import PropertyChangeEvent from '../../events/propertychangeevent.js';
import PropertyChange from './propertychange.js';

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');


/**
 * A basic data model backed by Crossfilter
 *
 * Note on item removal:
 * A remove function was not included because crossfilter only supports removing the results of the current
 * set of filters. There is no function to remove a specific set of items, so it's much faster to clear the
 * filter and recreate it with the new set of items. Use the setData function to perform both operations
 * at once.
 *
 * @template T,S,BIN
 */
export default class DataModel extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?crossfilter.XF}
     * @protected
     */
    this.xf = crossfilter();

    /**
     * @type {!Object<string, crossfilter.Dimension>}
     * @protected
     */
    this.dimensions = {};

    /**
     * @type {?function(this:S, T, number, !Array<T>):boolean}
     * @protected
     */
    this.filterFunction = null;

    /**
     * @type {!Object<string, *>}
     * @protected
     */
    this.filterValues = {};
  }

  /**
   * Add items to the model. While items can be added individually, it is <b>highly</b> recommended to add them in bulk.
   * Bulk adds are significantly faster in crossfilter.
   *
   * @param {S|Array<S>} items
   */
  add(items) {
    if (!this.isDisposed()) {
      var then = Date.now();

      if (!Array.isArray(items)) {
        items = [items];
      }

      this.xf.add(items);

      log.fine(logger,
          'Added ' + items.length + ' items to the model in ' + (Date.now() - then) + 'ms.');
    }
  }

  /**
   * Clears all items in the model.
   */
  clear() {
    if (!this.isDisposed()) {
      for (var key in this.dimensions) {
        this.dimensions[key].filterAll();
      }

      this.xf.remove();

      // reapply previous filter values
      for (var key in this.filterValues) {
        if (this.dimensions[key] != undefined && this.filterValues[key] != undefined) {
          this.dimensions[key].filter(this.filterValues[key]);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // discard filters so they aren't applied after clear
    googObject.clear(this.filterValues);

    // remove data from the crossfilters
    this.clear();

    // dispose/remove all custom dimensions
    for (var key in this.dimensions) {
      this.dimensions[key].dispose();
      delete this.dimensions[key];
    }

    this.xf = null;

    super.disposeInternal();
  }

  /**
   * Get the filter function used by the model.
   *
   * @return {?function(this:S, T, number, !Array<T>):boolean}
   * @template T,S
   */
  getFilterFunction() {
    return this.filterFunction;
  }

  /**
   * Set the filter function used by the model.
   *
   * @param {?function(this:S, T, number, !Array<T>):boolean} fn
   * @template T,S
   */
  setFilterFunction(fn) {
    this.filterFunction = fn;
  }

  /**
   * Adds a dimension to the model with the provided accessor function.
   *
   * @param {string} id Unique id of the dimension
   * @param {function(this: S, T):*} accessorFn Accessor function for the value to be filtered
   * @param {boolean=} opt_isArray if the dimension key is an array (for scenarios where a row has multi key)
   * @template T,S
   */
  addDimension(id, accessorFn, opt_isArray) {
    if (!this.isDisposed()) {
      this.removeDimension(id);

      // add the dimension to the crossfilter
      this.dimensions[id] = this.xf.dimension(accessorFn, opt_isArray);

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.DIMENSION, id));
    }
  }

  /**
   * If the data model has the specified dimension.
   *
   * @param {string} id Unique id of the dimension
   * @return {boolean}
   */
  hasDimension(id) {
    return this.dimensions != null && id in this.dimensions;
  }

  /**
   * Removes a dimension from the model.
   *
   * @param {string} id Unique id of the dimension
   */
  removeDimension(id) {
    if (!this.isDisposed() && id in this.dimensions) {
      // remove the old dimension with this id
      var old = this.dimensions[id];
      old.dispose();
      delete this.dimensions[id];
      delete this.filterValues[id];
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.DIMENSION, id));
    }
  }

  /**
   * Filters the specified dimension based on a value, range, function, or undefined to filter all values.
   *
   * @param {string} id Unique id of the dimension
   * @param {*=} opt_value The value to filter against. See the crossfilter documentation for dimension#filter details.
   */
  filterDimension(id, opt_value) {
    if (!this.isDisposed()) {
      if (id in this.dimensions) {
        this.dimensions[id].filter(opt_value);
      }

      if (opt_value != undefined) {
        this.filterValues[id] = opt_value;
      } else {
        delete this.filterValues[id];
      }
    }
  }

  /**
   * Apply a set of filters
   *
   * @param {!Object<string, *>} filters
   */
  applyFilters(filters) {
    if (!this.isDisposed()) {
      var temp = googObject.clone(filters);
      for (var key in temp) {
        this.filterDimension(key, temp[key]);
      }
    }
  }

  /**
   * Clears all dimension filters and the filterFunction
   * Return the filters that were cleared
   *
   * @return {!Object<string, *>}
   */
  clearAllFilters() {
    if (!this.isDisposed()) {
      var temp = googObject.clone(this.filterValues);
      for (var key in this.filterValues) {
        this.filterDimension(key);
      }
      return temp;
    }
    return {};
  }

  /**
   * Gets the top record of the dimension
   *
   * @param {string} id Unique id of the dimension
   * @return {*} the value | null if dimension does not exist | undefined if attr not found or dimension is empty
   */
  getTopRecord(id) {
    if (!this.isDisposed() && this.hasDimension(id)) {
      var topRecord = this.dimensions[id].top(1);
      return topRecord.length == 1 ? topRecord[0] : undefined;
    }
    return null;
  }

  /**
   * Gets the bottom record of the dimension
   *
   * @param {string} id Unique id of the dimension
   * @return {*} the value | null if dimension does not exist | undefined attr not found or dimension is empty
   */
  getBottomRecord(id) {
    if (!this.isDisposed() && this.hasDimension(id)) {
      var bottomRecord = this.dimensions[id].bottom(1);
      return bottomRecord.length == 1 ? bottomRecord[0] : undefined;
    }
    return null;
  }

  /**
   * Determines if all records in dimension <i>id</i> are empty for its value function
   *
   * @param {!string} id The dimension id
   * @param {!*} emptyIdentifier The representation of what empty means for the attribute
   * @return {?boolean} true if the dimension value is empty for all records of the dimension
   */
  isDimensionValueEmptyAll(id, emptyIdentifier) {
    if (!this.isDisposed() && this.hasDimension(id)) {
      var group = this.dimensions[id].group();
      var groupResults = /** @type {Array.<crossfilter.GroupKV>} */ (group.all());
      var isEmpty = groupResults != null &&
                    groupResults.length == 1 &&
                    groupResults[0].key === emptyIdentifier;

      // dispose the group
      group.dispose();

      return isEmpty;
    }
    return null;
  }

  /**
   * Determines if any records in dimension <i>id</i> are empty for its value function
   *
   * @param {!string} id The dimension id
   * @param {!*} emptyIdentifier The representation of what is empty for the attribute
   * @return {?boolean} true if the dimension value is empty for any records of the dimension
   */
  isDimensionValueEmptyAny(id, emptyIdentifier) {
    if (!this.isDisposed() && this.hasDimension(id)) {
      var group = this.dimensions[id].group();
      var groupResults = /** @type {Array.<crossfilter.GroupKV>} */ (group.all());
      var hasEmpty = false;

      for (var i = 0; i < groupResults.length; i++) {
        if (groupResults[i].key === emptyIdentifier) {
          hasEmpty = true;
          break;
        }
      }

      // dispose the group
      group.dispose();

      return hasEmpty;
    }
    return null;
  }

  /**
   * Get all of the keys for a given dimension
   *
   * @param {!string} id The dimension id
   * @return {Array} All of the dimension's keys, naturally sorted
   */
  getDimensionKeys(id) {
    if (!this.isDisposed() && this.hasDimension(id)) {
      var group = this.dimensions[id].group();
      var keys = group.all().map(function(v) {
        return v.key;
      });

      // dispose the group
      group.dispose();

      return keys;
    }
    return null;
  }

  /**
   * Groups data by a dimension in the crossfilter instance.
   *
   * @param {string} id The dimension id
   * @param {function(S):T} accessorFn The group key accessor function
   * @param {function(BIN<S>, S):BIN<S>} addFn The group reduce add function
   * @param {function(BIN<S>, S):BIN<S>} removeFn The group reduce remove function
   * @param {function():BIN<S>} initFn The group key accessor function
   * @return {Array}
   * @template T,S,BIN
   */
  groupData(id, accessorFn, addFn, removeFn, initFn) {
    var results;
    if (!this.isDisposed()) {
      var dimension = this.dimensions[id];
      if (dimension) {
        results = this.groupDataInternal(dimension, accessorFn, addFn, removeFn, initFn);
      }
    }

    return results || [];
  }

  /**
   * Internal function to create a group, get the results, and destroy the group.
   *
   * @param {!crossfilter.Dimension} dim The XF dimension
   * @param {function(S):T} accessorFn The group key accessor function
   * @param {function(BIN<S>, S):BIN<S>} addFn The group reduce add function
   * @param {function(BIN<S>, S):BIN<S>} removeFn The group reduce remove function
   * @param {function():BIN<S>} initFn The group key accessor function
   * @return {Array}
   * @protected
   * @template T,S,BIN
   */
  groupDataInternal(dim, accessorFn, addFn, removeFn, initFn) {
    var group = dim.group(accessorFn);
    group.reduce(addFn, removeFn, initFn);

    var results = group.top(Infinity) || [];
    group.dispose();

    return results;
  }

  /**
   * Gets the top opt_value results from Crossfilter.
   *
   * @param {number=} opt_value The number of results to get, defaults to all of them (Infinity)
   * @param {string=} opt_dim dimension to get results from
   * @param {boolean=} opt_bottom get bottom records (as opposed to top)
   * @return {!Array<S>}
   */
  getResults(opt_value, opt_dim, opt_bottom) {
    if (!this.isDisposed()) {
      var dim = opt_dim && this.hasDimension(opt_dim) ?
        this.dimensions[opt_dim] : googObject.getAnyValue(this.dimensions);
      opt_value = opt_value || Infinity;

      if (dim) {
        var results = /** @type {!Array<S>} */ (opt_bottom ? dim.bottom(opt_value) : dim.top(opt_value));

        if (this.filterFunction) {
          results = results.filter(this.filterFunction, this);
        }

        return results;
      }
    }

    log.error(logger, 'There are no dimensions for the model to filter on!');
    return [];
  }

  /**
   * Get the number of records in the model before filters.
   *
   * @return {number}
   */
  getSize() {
    return this.xf ? this.xf.size() : 0;
  }

  /**
   * Check if there are any items in the model.
   *
   * @return {boolean}
   */
  isEmpty() {
    return (!this.xf || this.xf.size() <= 0);
  }

  /**
   * Sets the items in the model, clearing any previous items.
   *
   * @param {Object|Array<Object>} items
   */
  setData(items) {
    this.clear();
    this.add(items);
  }
}


/**
 * Separator for multidimensional grouping
 * @type {string}
 * @const
 */
DataModel.SEPARATOR = '$%';


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.data.xf.DataModel');
