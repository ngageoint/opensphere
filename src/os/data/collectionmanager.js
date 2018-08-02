goog.provide('os.data.CollectionManager');

goog.require('goog.events.EventTarget');
goog.require('os.events.PropertyChangeEvent');



/**
 * @extends {goog.events.EventTarget}
 * @template T
 * @constructor
 */
os.data.CollectionManager = function() {
  os.data.CollectionManager.base(this, 'constructor');

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
};
goog.inherits(os.data.CollectionManager, goog.events.EventTarget);


/**
 * @param {T} item
 * @return {boolean} True if added, false if already in collection
 */
os.data.CollectionManager.prototype.add = function(item) {
  var added = this.addInternal(item);

  if (added) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('add', item));
  }

  return added;
};


/**
 * @param {T} item
 * @return {boolean}
 * @protected
 */
os.data.CollectionManager.prototype.addInternal = function(item) {
  var id = this.getId(item);

  if (!this.contains(item)) {
    this.index_[id] = item;
    this.items_.push(item);
    return true;
  }

  return false;
};


/**
 * Gets the ID of an item
 * @param {T} item
 * @return {!string}
 */
os.data.CollectionManager.prototype.getId = function(item) {
  return item['id'];
};


/**
 * @param {?(string|T)} idOrItem
 * @return {?string}
 * @protected
 */
os.data.CollectionManager.prototype.getIdOrItem = function(idOrItem) {
  if (!idOrItem) {
    return null;
  }
  return goog.isString(idOrItem) ? idOrItem : this.getId(/** @type {T} */ (idOrItem));
};


/**
 * @param {?(string|T)} idOrItem
 * @return {boolean}
 */
os.data.CollectionManager.prototype.contains = function(idOrItem) {
  var id = this.getIdOrItem(idOrItem);
  return id ? id in this.index_ : false;
};


/**
 * @param {?(string|T)} idOrItem
 * @return {?T}
 */
os.data.CollectionManager.prototype.get = function(idOrItem) {
  var id = this.getIdOrItem(idOrItem);
  return id && this.contains(id) ? this.index_[id] : null;
};


/**
 * @return {!Array<T>}
 */
os.data.CollectionManager.prototype.getAll = function() {
  return this.items_.slice();
};


/**
 * @param {?(string|T)} idOrItem
 * @return {?T} The removed item or null if it was not removed
 */
os.data.CollectionManager.prototype.remove = function(idOrItem) {
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
      this.dispatchEvent(new os.events.PropertyChangeEvent('remove', item));
    }
  }

  return item;
};
