goog.provide('os.histo.Histogram');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('os.data.xf.IGroupable');
goog.require('os.histo.Bin');
goog.require('os.histo.IBinMethod');
goog.require('os.histo.Result');



/**
 * Histogram constructs a histogram via crossfilter from various bin configurations. It
 * requires at least one completely unique field for proper removal of items (defaults
 * to 'id').
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {os.data.xf.IGroupable<T>}
 * @template T
 */
os.histo.Histogram = function() {
  os.histo.Histogram.base(this, 'constructor');

  /**
   * @type {?os.histo.IBinMethod.<T>}
   * @protected
   */
  this.binMethod = null;

  /**
   * The user-facing name for the histogram.
   * @type {?string}
   * @protected
   */
  this.name = null;

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.dimension = null;

  /**
   * @type {?crossfilter.Dimension}
   * @protected
   */
  this.uniqueDimension = null;

  /**
   * @type {function(T):(Object|string|number|null)}
   * @protected
   */
  this.uniqueDimFunction = os.histo.Histogram.DEFAULT_DIM_FUNCTION_;

  /**
   * @type {?crossfilter.Group}
   * @protected
   */
  this.group = null;

  /**
   * @type {crossfilter.XF}
   * @protected
   */
  this.xf = crossfilter();

  this.initUnique();
};
goog.inherits(os.histo.Histogram, goog.events.EventTarget);


/**
 * @param {?} item
 * @return {string}
 * @private
 */
os.histo.Histogram.DEFAULT_DIM_FUNCTION_ = function(item) {
  return item['id'];
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.disposeInternal = function() {
  os.histo.Histogram.superClass_.disposeInternal.call(this);

  if (this.uniqueDimension) {
    this.uniqueDimension.dispose();
    this.uniqueDimension = null;
  }

  this.setBinMethod(null);
  this.clear();
};


/**
 * Initializes the unique dimension
 * @protected
 */
os.histo.Histogram.prototype.initUnique = function() {
  this.uniqueDimension = this.xf.dimension(this.uniqueDimFunction);
};


/**
 * Fires a change event when the histogram changes.
 * @protected
 */
os.histo.Histogram.prototype.onDataChange = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * Add item(s) to the histogram
 * @param {!(T|Array.<!T>)} items
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.histo.Histogram.prototype.addItems = function(items) {
  if (!goog.isArray(items)) {
    items = [items];
  }

  this.xf.add(items);
  this.onDataChange();
};


/**
 * Remove item(s) from the histogram
 * @param {!(T|Array.<!T>)} items
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.histo.Histogram.prototype.removeItems = function(items) {
  if (!goog.isArray(items)) {
    items = [items];
  }

  goog.asserts.assert(this.uniqueDimension);
  goog.asserts.assert(this.uniqueDimFunction);

  for (var i = 0, n = items.length; i < n; i++) {
    var key = this.uniqueDimFunction(items[i]);
    this.uniqueDimension.filterExact(key);
    this.xf.remove();
  }

  this.uniqueDimension.filterAll();
  this.onDataChange();
};


/**
 * Clears the histogram.
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.histo.Histogram.prototype.clear = function() {
  this.xf.remove();
  this.onDataChange();
};


/**
 * Get the results
 * @return {Array.<os.histo.Bin.<T>>}
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.histo.Histogram.prototype.getResults = function() {
  if (this.group) {
    var result = /** @type {!Array.<!os.histo.Result.<T>>} */ (this.group.top(Infinity));
    return result.map(this.map_, this);
  }

  return [];
};


/**
 * @param {os.histo.Result.<T>} item
 * @param {number} i
 * @param {Array} arr
 * @return {os.histo.Bin.<T>}
 * @private
 */
os.histo.Histogram.prototype.map_ = function(item, i, arr) {
  var bin = /** @type {os.histo.Bin.<T>} */ (item.value);
  var items = bin.getItems();

  if (items && items.length > 0) {
    var thing = items[0];
    bin.setKey(this.binMethod.getBinKey(this.binMethod.getValue(thing)));
    bin.setLabel(this.binMethod.getBinLabel(thing));
  } else {
    bin.setKey(item.key);
    bin.setLabel(item.key.toString());
  }

  return bin;
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.getName = function() {
  return this.name;
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.setName = function(value) {
  this.name = value;
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.getBinMethod = function() {
  return this.binMethod;
};


/**
 * @inheritDoc
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.histo.Histogram.prototype.setBinMethod = function(method) {
  this.binMethod = method;

  if (this.group) {
    this.group.dispose();
    this.group = null;
  }

  if (this.dimension) {
    this.dimension.dispose();
    this.dimension = null;
  }

  if (method) {
    this.dimension = this.xf.dimension(method.getValue.bind(method));
    this.group = this.dimension.group(method.getBinKey.bind(method));
    this.group.reduce(this.reduceAdd.bind(this), this.reduceRemove.bind(this),
        this.reduceInit.bind(this));
  }

  this.onDataChange();
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.reduceAdd = function(bin, item) {
  bin.addItem(item);
  return bin;
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.reduceRemove = function(bin, item) {
  bin.removeItem(item);
  return bin;
};


/**
 * @inheritDoc
 */
os.histo.Histogram.prototype.reduceInit = function() {
  return new os.histo.Bin();
};
