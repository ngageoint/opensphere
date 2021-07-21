goog.module('os.histo.Bin');
goog.module.declareLegacyNamespace();

const Result = goog.requireType('os.histo.Result');

/**
 * Represents a single bin in a histogram
 *
 * @template T
 * @unrestricted
 */
class Bin {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {string|number}
     */
    this.key = '';

    /**
     * @type {string}
     */
    this.label = '';

    /**
     * @type {?Array<!Result<T>>}
     * @protected
     */
    this.children = null;

    /**
     * @type {Array<T>}
     */
    this.items = [];

    /**
     * The count of things in the bin; accessible for export
     * @type {number}
     */
    this['count'] = 0;

    /**
     * If the bin is considered selected; accessible for export
     * @type {boolean}
     */
    this['sel'] = false;

    /**
     * If the bin is considered highlighted; accessible for export
     * @type {boolean}
     */
    this['highlight'] = false;

    /**
     * This is just so we can show bins in a slickgrid instance. It will be set by the label so when a bin is recreated
     * slickgrid will identify it as the same item for selection purposes.
     * @type {string}
     */
    this['id'] = '';
  }

  /**
   * Adds an item to the bin
   *
   * @param {T} item
   */
  addItem(item) {
    this.items.push(item);
  }

  /**
   * Remove an item from the bin
   *
   * @param {T} item
   */
  removeItem(item) {
    var i = this.items.indexOf(item);
    if (i > -1) {
      this.items.splice(i, 1);
    }
  }

  /**
   * Clears the bin
   */
  clear() {
    this.items.length = 0;
  }

  /**
   * Gets the count for the bin
   *
   * @return {number}
   */
  getCount() {
    return this.items.length;
  }

  /**
   * Gets the items in the bin
   *
   * @return {Array<T>}
   */
  getItems() {
    return this.items;
  }

  /**
   * Gets the key
   *
   * @return {string|number}
   */
  getKey() {
    return this.key;
  }

  /**
   * Sets the key
   *
   * @param {string|number} value
   */
  setKey(value) {
    this.key = value;
  }

  /**
   * Gets the label
   *
   * @return {string}
   */
  getLabel() {
    return this.label;
  }

  /**
   * Sets the label
   *
   * @param {string} label
   */
  setLabel(label) {
    this.label = label;
    this['id'] = label;
  }

  /**
   * Gets the child bins
   *
   * @return {?Array<Result<T>>}
   */
  getChildren() {
    return this.children;
  }

  /**
   * Sets the child bins
   *
   * @param {?Array<!Result<T>>} children
   */
  setChildren(children) {
    this.children = children;
  }

  /**
   * Returns the id
   *
   * @return {number} true if the bins have the same id's
   */
  getId() {
    return this['id'];
  }
}

exports = Bin;
