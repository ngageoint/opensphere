goog.module('os.data.CollectionManager');

const EventTarget = goog.require('goog.events.EventTarget');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');


/**
 * @template T
 */
class CollectionManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!Array<T>}
     * @private
     */
    this.items_ = [];


    /**
     * @type {!Object<string, T>}
     * @private
     */
    this.index_ = {};
  }

  /**
   * @param {T} item
   * @return {boolean} True if added, false if already in collection
   */
  add(item) {
    var added = this.addInternal(item);

    if (added) {
      this.dispatchEvent(new PropertyChangeEvent('add', item));
    }

    return added;
  }

  /**
   * @param {T} item
   * @return {boolean}
   * @protected
   */
  addInternal(item) {
    var id = this.getId(item);

    if (!this.contains(item)) {
      this.index_[id] = item;
      this.items_.push(item);
      return true;
    }

    return false;
  }

  /**
   * Gets the ID of an item
   *
   * @param {T} item
   * @return {!string}
   */
  getId(item) {
    return item['id'];
  }

  /**
   * @param {?(string|T)} idOrItem
   * @return {?string}
   * @protected
   */
  getIdOrItem(idOrItem) {
    if (!idOrItem) {
      return null;
    }
    return typeof idOrItem === 'string' ? idOrItem : this.getId(/** @type {T} */ (idOrItem));
  }

  /**
   * @param {?(string|T)} idOrItem
   * @return {boolean}
   */
  contains(idOrItem) {
    var id = this.getIdOrItem(idOrItem);
    return id ? id in this.index_ : false;
  }

  /**
   * @param {?(string|T)} idOrItem
   * @return {?T}
   */
  get(idOrItem) {
    var id = this.getIdOrItem(idOrItem);
    return id && this.contains(id) ? this.index_[id] : null;
  }

  /**
   * @return {!Array<T>}
   */
  getAll() {
    return this.items_.slice();
  }

  /**
   * @param {?(string|T)} idOrItem
   * @return {?T} The removed item or null if it was not removed
   */
  remove(idOrItem) {
    var id = this.getIdOrItem(idOrItem);

    var item = this.get(id);

    if (id && item) {
      delete this.index_[id];
      var i = this.items_.length;
      var count = i;

      while (i--) {
        if (this.items_[i] === item) {
          this.items_.splice(i, 1);
        }
      }

      if (this.items_.length !== count) {
        this.dispatchEvent(new PropertyChangeEvent('remove', item));
      }
    }

    return item;
  }
}

exports = CollectionManager;
