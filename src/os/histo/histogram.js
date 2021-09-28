goog.declareModuleId('os.histo.Histogram');

import Bin from './bin.js';

const asserts = goog.require('goog.asserts');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');

const {default: IGroupable} = goog.requireType('os.data.xf.IGroupable');
const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');
const {default: Result} = goog.requireType('os.histo.Result');


/**
 * @param {?} item
 * @return {string}
 */
const defaultDimFunction = (item) => item['id'];

/**
 * Histogram constructs a histogram via crossfilter from various bin configurations. It
 * requires at least one completely unique field for proper removal of items (defaults
 * to 'id').
 *
 * @implements {IGroupable<T>}
 * @template T
 */
export default class Histogram extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?IBinMethod<T>}
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
    this.uniqueDimFunction = defaultDimFunction;

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.uniqueDimension) {
      this.uniqueDimension.dispose();
      this.uniqueDimension = null;
    }

    this.setBinMethod(null);
    this.clear();
  }

  /**
   * Initializes the unique dimension
   *
   * @protected
   */
  initUnique() {
    this.uniqueDimension = this.xf.dimension(this.uniqueDimFunction);
  }

  /**
   * Fires a change event when the histogram changes.
   *
   * @protected
   */
  onDataChange() {
    this.dispatchEvent(GoogEventType.CHANGE);
  }

  /**
   * Add item(s) to the histogram
   *
   * @param {!(T|Array<!T>)} items
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  addItems(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    this.xf.add(items);
    this.onDataChange();
  }

  /**
   * Remove item(s) from the histogram
   *
   * @param {!(T|Array<!T>)} items
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  removeItems(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    asserts.assert(this.uniqueDimension);
    asserts.assert(this.uniqueDimFunction);

    for (var i = 0, n = items.length; i < n; i++) {
      var key = this.uniqueDimFunction(items[i]);
      this.uniqueDimension.filterExact(key);
      this.xf.remove();
    }

    this.uniqueDimension.filterAll();
    this.onDataChange();
  }

  /**
   * Clears the histogram.
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  clear() {
    this.xf.remove();
    this.onDataChange();
  }

  /**
   * Get the results
   *
   * @return {Array<Bin<T>>}
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  getResults() {
    if (this.group) {
      var result = /** @type {!Array<!Result<T>>} */ (this.group.top(Infinity));
      return result.map(this.map_, this);
    }

    return [];
  }

  /**
   * @param {Result<T>} item
   * @param {number} i
   * @param {Array} arr
   * @return {Bin<T>}
   * @private
   */
  map_(item, i, arr) {
    var bin = /** @type {Bin<T>} */ (item.value);
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
   * @inheritDoc
   */
  getBinMethod() {
    return this.binMethod;
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setBinMethod(method) {
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
  }

  /**
   * @inheritDoc
   */
  reduceAdd(bin, item) {
    bin.addItem(item);
    return bin;
  }

  /**
   * @inheritDoc
   */
  reduceRemove(bin, item) {
    bin.removeItem(item);
    return bin;
  }

  /**
   * @inheritDoc
   */
  reduceInit() {
    return new Bin();
  }
}
