goog.provide('os.data.xf.DataModel');
goog.provide('os.data.xf.PropertyChange');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('os.events.PropertyChangeEvent');


/**
 * Time model event types
 * @enum {string}
 */
os.data.xf.PropertyChange = {
  DIMENSION: 'xf:dimension'
};



/**
 * A basic data model backed by Crossfilter
 *
 * Note on item removal:
 * A remove function was not included because crossfilter only supports removing the results of the current
 * set of filters. There is no function to remove a specific set of items, so it's much faster to clear the
 * filter and recreate it with the new set of items. Use the setData function to perform both operations
 * at once.
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 * @template T,S,BIN
 */
os.data.xf.DataModel = function() {
  os.data.xf.DataModel.base(this, 'constructor');

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
};
goog.inherits(os.data.xf.DataModel, goog.events.EventTarget);


/**
 * Separator for multidimensional grouping
 * @type {string}
 * @const
 */
os.data.xf.DataModel.SEPARATOR = '$%';


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.xf.DataModel.LOGGER_ = goog.log.getLogger('os.data.xf.DataModel');


/**
 * Add items to the model. While items can be added individually, it is <b>highly</b> recommended to add them in bulk.
 * Bulk adds are significantly faster in crossfilter.
 * @param {S|Array<S>} items
 */
os.data.xf.DataModel.prototype.add = function(items) {
  if (!this.isDisposed()) {
    var then = goog.now();

    if (!goog.isArray(items)) {
      items = [items];
    }

    this.xf.add(items);

    goog.log.fine(os.data.xf.DataModel.LOGGER_,
        'Added ' + items.length + ' items to the model in ' + (goog.now() - then) + 'ms.');
  }
};


/**
 * Clears all items in the model.
 */
os.data.xf.DataModel.prototype.clear = function() {
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
};


/**
 * @inheritDoc
 */
os.data.xf.DataModel.prototype.disposeInternal = function() {
  // discard filters so they aren't applied after clear
  goog.object.clear(this.filterValues);

  // remove data from the crossfilters
  this.clear();

  // dispose/remove all custom dimensions
  for (var key in this.dimensions) {
    this.dimensions[key].dispose();
    delete this.dimensions[key];
  }

  this.xf = null;

  os.data.xf.DataModel.base(this, 'disposeInternal');
};


/**
 * Get the filter function used by the model.
 * @return {?function(this:S, T, number, !Array<T>):boolean}
 * @template T,S
 */
os.data.xf.DataModel.prototype.getFilterFunction = function() {
  return this.filterFunction;
};


/**
 * Set the filter function used by the model.
 * @param {?function(this:S, T, number, !Array<T>):boolean} fn
 * @template T,S
 */
os.data.xf.DataModel.prototype.setFilterFunction = function(fn) {
  this.filterFunction = fn;
};


/**
 * Adds a dimension to the model with the provided accessor function.
 *
 * @param {string} id Unique id of the dimension
 * @param {function(this: S, T):*} accessorFn Accessor function for the value to be filtered
 * @param {boolean=} opt_isArray if the dimension key is an array (for scenarios where a row has multi key)
 * @template T,S
 */
os.data.xf.DataModel.prototype.addDimension = function(id, accessorFn, opt_isArray) {
  if (!this.isDisposed()) {
    this.removeDimension(id);

    // add the dimension to the crossfilter
    this.dimensions[id] = this.xf.dimension(accessorFn, opt_isArray);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.data.xf.PropertyChange.DIMENSION, id));
  }
};


/**
 * If the data model has the specified dimension.
 * @param {string} id Unique id of the dimension
 * @return {boolean}
 */
os.data.xf.DataModel.prototype.hasDimension = function(id) {
  return this.dimensions != null && id in this.dimensions;
};


/**
 * Removes a dimension from the model.
 * @param {string} id Unique id of the dimension
 */
os.data.xf.DataModel.prototype.removeDimension = function(id) {
  if (!this.isDisposed() && id in this.dimensions) {
    // remove the old dimension with this id
    var old = this.dimensions[id];
    old.dispose();
    delete this.dimensions[id];
    delete this.filterValues[id];
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.data.xf.PropertyChange.DIMENSION, id));
  }
};


/**
 * Filters the specified dimension based on a value, range, function, or undefined to filter all values.
 * @param {string} id Unique id of the dimension
 * @param {*=} opt_value The value to filter against. See the crossfilter documentation for dimension#filter details.
 */
os.data.xf.DataModel.prototype.filterDimension = function(id, opt_value) {
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
};


/**
 * Apply a set of filters
 * @param {!Object<string, *>} filters
 */
os.data.xf.DataModel.prototype.applyFilters = function(filters) {
  if (!this.isDisposed()) {
    var temp = goog.object.clone(filters);
    for (var key in temp) {
      this.filterDimension(key, temp[key]);
    }
  }
};


/**
 * Clears all dimension filters and the filterFunction
 * Return the filters that were cleared
 * @return {!Object<string, *>}
 */
os.data.xf.DataModel.prototype.clearAllFilters = function() {
  if (!this.isDisposed()) {
    var temp = goog.object.clone(this.filterValues);
    for (var key in this.filterValues) {
      this.filterDimension(key);
    }
    return temp;
  }
  return {};
};


/**
 * Gets the top record of the dimension
 * @param {string} id Unique id of the dimension
 * @return {*} the value | null if dimension does not exist | undefined if attr not found or dimension is empty
 */
os.data.xf.DataModel.prototype.getTopRecord = function(id) {
  if (!this.isDisposed() && this.hasDimension(id)) {
    var topRecord = this.dimensions[id].top(1);
    return topRecord.length == 1 ? topRecord[0] : undefined;
  }
  return null;
};


/**
 * Gets the bottom record of the dimension
 * @param {string} id Unique id of the dimension
 * @return {*} the value | null if dimension does not exist | undefined attr not found or dimension is empty
 */
os.data.xf.DataModel.prototype.getBottomRecord = function(id) {
  if (!this.isDisposed() && this.hasDimension(id)) {
    var bottomRecord = this.dimensions[id].bottom(1);
    return bottomRecord.length == 1 ? bottomRecord[0] : undefined;
  }
  return null;
};


/**
 * Determines if all records in dimension <i>id</i> are empty for its value function
 * @param {!string} id The dimension id
 * @param {!*} emptyIdentifier The representation of what empty means for the attribute
 * @return {?boolean} true if the dimension value is empty for all records of the dimension
 */
os.data.xf.DataModel.prototype.isDimensionValueEmptyAll = function(id, emptyIdentifier) {
  if (!this.isDisposed() && this.hasDimension(id)) {
    var groupResults = /** @type {Array.<crossfilter.GroupKV>} */ (this.dimensions[id].group().all());
    var isEmpty = groupResults != null &&
                  groupResults.length == 1 &&
                  groupResults[0].key === emptyIdentifier;
    return isEmpty;
  }
  return null;
};


/**
 * Determines if any records in dimension <i>id</i> are empty for its value function
 * @param {!string} id The dimension id
 * @param {!*} emptyIdentifier The representation of what is empty for the attribute
 * @return {?boolean} true if the dimension value is empty for any records of the dimension
 */
os.data.xf.DataModel.prototype.isDimensionValueEmptyAny = function(id, emptyIdentifier) {
  if (!this.isDisposed() && this.hasDimension(id)) {
    var groupResults = /** @type {Array.<crossfilter.GroupKV>} */ (this.dimensions[id].group().all());
    var hasEmpty = false;

    for (var i = 0; i < groupResults.length; i++) {
      if (groupResults[i].key === emptyIdentifier) {
        hasEmpty = true;
        break;
      }
    }

    return hasEmpty;
  }
  return null;
};


/**
 * Get all of the keys for a given dimension
 * @param {!string} id The dimension id
 * @return {Array} All of the dimension's keys, naturally sorted
 */
os.data.xf.DataModel.prototype.getDimensionKeys = function(id) {
  if (!this.isDisposed() && this.hasDimension(id)) {
    return this.dimensions[id].group().all().map(function(v) {
      return v.key;
    });
  }
  return null;
};


/**
 * Groups data by a dimension in the crossfilter instance.
 * @param {string} id The dimension id
 * @param {function(S):T} accessorFn The group key accessor function
 * @param {function(BIN<S>, S):BIN<S>} addFn The group reduce add function
 * @param {function(BIN<S>, S):BIN<S>} removeFn The group reduce remove function
 * @param {function():BIN<S>} initFn The group key accessor function
 * @return {Array}
 * @template T,S,BIN
 */
os.data.xf.DataModel.prototype.groupData = function(id, accessorFn, addFn, removeFn, initFn) {
  var results;
  if (!this.isDisposed()) {
    var dimension = this.dimensions[id];
    if (dimension) {
      results = this.groupDataInternal(dimension, accessorFn, addFn, removeFn, initFn);
    }
  }

  return results || [];
};


/**
 * Internal function to create a group, get the results, and destroy the group.
 * @param {!crossfilter.Dimension} dim The XF dimension
 * @param {function(S):T} accessorFn The group key accessor function
 * @param {function(BIN<S>, S):BIN<S>} addFn The group reduce add function
 * @param {function(BIN<S>, S):BIN<S>} removeFn The group reduce remove function
 * @param {function():BIN<S>} initFn The group key accessor function
 * @return {Array}
 * @protected
 * @template T,S,BIN
 */
os.data.xf.DataModel.prototype.groupDataInternal = function(dim, accessorFn, addFn, removeFn, initFn) {
  var group = dim.group(accessorFn);
  group.reduce(addFn, removeFn, initFn);

  var results = group.top(Infinity) || [];
  group.dispose();

  return results;
};


/**
 * Gets the top opt_value results from Crossfilter.
 * @param {number=} opt_value The number of results to get, defaults to all of them (Infinity)
 * @param {string=} opt_dim dimension to get results from
 * @param {boolean=} opt_bottom get bottom records (as opposed to top)
 * @return {!Array<S>}
 */
os.data.xf.DataModel.prototype.getResults = function(opt_value, opt_dim, opt_bottom) {
  if (!this.isDisposed()) {
    var dim = opt_dim && this.hasDimension(opt_dim) ?
          this.dimensions[opt_dim] : goog.object.getAnyValue(this.dimensions);
    opt_value = opt_value || Infinity;

    if (dim) {
      var results = /** @type {!Array<S>} */ (opt_bottom ? dim.bottom(opt_value) : dim.top(opt_value));

      if (this.filterFunction) {
        results = goog.array.filter(results, this.filterFunction, this);
      }

      return results;
    }
  }

  goog.log.error(os.data.xf.DataModel.LOGGER_, 'There are no dimensions for the model to filter on!');
  return [];
};


/**
 * Get the number of records in the model before filters.
 * @return {number}
 */
os.data.xf.DataModel.prototype.getSize = function() {
  return this.xf ? this.xf.size() : 0;
};


/**
 * Check if there are any items in the model.
 * @return {boolean}
 */
os.data.xf.DataModel.prototype.isEmpty = function() {
  return (!this.xf || this.xf.size() <= 0);
};


/**
 * Sets the items in the model, clearing any previous items.
 * @param {Object|Array<Object>} items
 */
os.data.xf.DataModel.prototype.setData = function(items) {
  this.clear();
  this.add(items);
};
