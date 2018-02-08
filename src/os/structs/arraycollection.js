goog.provide('os.structs.ArrayCollection');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.Collection');
goog.require('os.structs.EventType');



/**
 * A collection of items in an array. The array is always kept sorted and
 * filtered by the given functions. The key advantage of this class over simply
 * using <code>Array</code> with {@link goog.structs} calls is that it
 * keeps the collection sorted and filtered as items are added and removed
 * without having to re-filter or re-sort the entire collection.
 *
 * @param {?Array.<T>=} opt_source An optional array of elements to populate
 *    the collection.
 * @implements {goog.structs.Collection}
 * @extends {goog.events.EventTarget}
 * @template T
 * @constructor
 */
os.structs.ArrayCollection = function(opt_source) {
  os.structs.ArrayCollection.base(this, 'constructor');
  this.source_ = opt_source || [];
};
goog.inherits(os.structs.ArrayCollection, goog.events.EventTarget);


/**
 * A timer that helps pool changed events
 * @type {?goog.async.Delay}
 * @private
 */
os.structs.ArrayCollection.prototype.delay_ = null;


/**
 * The source array
 * @type {!Array.<T>}
 * @private
 */
os.structs.ArrayCollection.prototype.source_;


/**
 * Indicates the raw data has changed in the source array
 * @type {boolean}
 * @private
 */
os.structs.ArrayCollection.prototype.sourceChanged_ = false;


/**
 * The view array
 * @type {?Array.<T>}
 * @private
 */
os.structs.ArrayCollection.prototype.view_ = null;


/**
 * Indicates the view array has changed
 * @type {boolean}
 * @private
 */
os.structs.ArrayCollection.prototype.viewChanged_ = false;


/**
 * The sort for the array
 * @type {?function(?, ?):!number|undefined}
 * @private
 */
os.structs.ArrayCollection.prototype.sort_ = null;


/**
 * Whether or not the sort has changed
 * @type {boolean}
 * @private
 */
os.structs.ArrayCollection.prototype.sortChanged_ = false;


/**
 * The filter for the array
 * @type {?function(*, number, Array): boolean}
 * @private
 */
os.structs.ArrayCollection.prototype.filter_ = null;


/**
 * The scope in which to run the filter
 * @type {*}
 * @private
 */
os.structs.ArrayCollection.prototype.filterScope_ = null;


/**
 * Whether or not the filter has changed
 * @type {boolean}
 * @private
 */
os.structs.ArrayCollection.prototype.filterChanged_ = false;


/**
 * Sets the delay for the {@link os.structs.EventType}
 * to fire. If the value is set to 0 or less, the event is dispatched on every
 * add, remove, and refresh. If set to greater than 0, a timer will run and be
 * reset on every add, remove, and refresh. The
 * {@link os.structs.EventType} event will fire when the
 * timer completes
 * @param {number} value The interval in ms
 */
os.structs.ArrayCollection.prototype.setChangeDelay = function(value) {
  if (value <= 0) {
    if (this.delay_) {
      this.delay_.stop();
      this.delay_.dispose();
      this.delay_ = null;
    }
  } else {
    if (this.delay_) {
      this.delay_.stop();
      this.delay_.dispose();
    }

    this.delay_ = new goog.async.Delay(this.onTimer_, value, this);
  }
};


/**
 * Gets the source array which contains all items without filters
 * @return {Array.<T>}
 */
os.structs.ArrayCollection.prototype.getSourceValues = function() {
  return this.source_;
};


/**
 * Gets the filter for the collection.
 * @return {?function(*, number, Array): boolean}
 */
os.structs.ArrayCollection.prototype.getFilter = function() {
  return this.filter_;
};


/**
 * Sets the filter for the collection. Use <code>refresh()</code> to apply the
 * changes.
 * @param {?function(*, number, Array): boolean} filter The filter
 * @param {*=} opt_this The scope in which to run the filter
 * @see {@link os.structs.ArrayCollection.prototype.refresh}
 */
os.structs.ArrayCollection.prototype.setFilter = function(filter, opt_this) {
  this.filterChanged_ = filter !== this.filter_;
  this.filter_ = filter;
  this.filterScope_ = opt_this;
  if (this.filter_ && !this.view_) {
    this.view_ = [];
  }
};


/**
 * Gets the sort for the collection
 * @return {?function(?, ?):!number|undefined} The sort function for the
 * collection
 */
os.structs.ArrayCollection.prototype.getSort = function() {
  return this.sort_;
};


/**
 * Sets the sort for the collection. Use <code>refresh()</code> to apply the
 * changes.
 * @param {?function(?, ?):!number|undefined} sort The sort function
 * @see {@link os.structs.ArrayCollection.prototype.refresh}
 */
os.structs.ArrayCollection.prototype.setSort = function(sort) {
  this.sortChanged_ = sort !== this.sort_;
  this.sort_ = sort;
};


/**
 * Refresh the collection. If the sort or filter has changed, this will re-sort
 * and re-filter the collection before dispatching a refresh event to the view.
 */
os.structs.ArrayCollection.prototype.refresh = function() {
  if (this.filterChanged_) {
    this.view_ = this.filter_ ?
        this.source_.filter(this.filter_, this.filterScope_) : null;
    this.filterChanged_ = false;
  }

  if (this.sortChanged_) {
    if (this.sort_) {
      if (this.view_) {
        this.view_.sort(this.sort_);
      }

      if (this.source_) {
        this.source_.sort(this.sort_);
      }
    }

    this.sortChanged_ = false;
  }

  this.sourceChanged_ = true;
  this.viewChanged_ = true;
  this.scheduleDataChanged();
};


/**
 * @inheritDoc
 */
os.structs.ArrayCollection.prototype.add = function(item) {
  /** @type {boolean} */ var addedToView = false;
  if (this.sort_) {
    goog.array.binaryInsert(this.source_, item, this.sort_);
    addedToView = this.addFiltered_(item);
  } else {
    this.source_.push(item);
    addedToView = this.addFiltered_(item);
  }

  if (addedToView) {
    this.viewChanged_ = true;
  }
  this.sourceChanged_ = true;
  this.scheduleDataChanged();
};


/**
 * Adds items to the filtered view
 * @param {T} item The item to add
 * @return {boolean} True if the item was added to the view, false otherwise.
 * @private
 */
os.structs.ArrayCollection.prototype.addFiltered_ = function(item) {
  /** @type {boolean} */ var val = true;
  if (this.filter_) {
    if (this.filter_.call(this.filterScope_, item, -1, null)) {
      if (this.sort_) {
        goog.array.binaryInsert(this.view_, item, this.sort_);
      } else {
        this.view_.push(item);
      }
    } else {
      val = false;
    }
  }

  return val;
};


/**
 * @inheritDoc
 */
os.structs.ArrayCollection.prototype.remove = function(item) {
  /** @type {boolean} */ var removedFromView = false;

  if (this.sort_) {
    goog.array.binaryRemove(this.source_, item, this.sort_);
    this.removeFiltered_(item);
  } else {
    /** @type {number} */ var i = this.getItemIndex_(item, this.source_);

    if (i > -1 && i < this.source_.length) {
      this.source_.splice(i, 1);
    }

    this.removeFiltered_(item);
  }

  if (removedFromView) {
    this.viewChanged_ = true;
  }
  this.sourceChanged = true;
  this.scheduleDataChanged();
};


/**
 * Removes the item at the specified index
 * @param {number} index The index to remove
 * @param {boolean=} opt_source Whether or not the index references the source
 * @return {?T} The removed element, or null if not found
 */
os.structs.ArrayCollection.prototype.removeAt = function(index, opt_source) {
  /** @type {Array.<T>} */
  var list = opt_source ? this.source_ : this.view_ || this.source_;

  /** @type {?T} */
  var item = null;
  if (index > -1 && index < list.length) {
    item = list.splice(index, 1)[0];
  }

  return item;
};


/**
 * Removes an item from the filtered view
 * @param {T} item The item to remove
 * @return {boolean} True if the item was removed from the view, false
 * otherwise.
 * @private
 */
os.structs.ArrayCollection.prototype.removeFiltered_ = function(item) {
  /** @type {boolean} */ var val = false;
  if (this.filter_) {
    if (this.sort_) {
      val = goog.array.binaryRemove(
          this.view_ ? this.view_ : [], item, this.sort_);
    } else {
      var i = this.getItemIndex_(item, this.view_);

      if (i > -1) {
        this.view_.splice(i, 1);
        val = true;
      }
    }
  }

  return val;
};


/**
 * @inheritDoc
 */
os.structs.ArrayCollection.prototype.contains = function(item) {
  return this.getItemIndex(item) > -1;
};


/**
 * @inheritDoc
 */
os.structs.ArrayCollection.prototype.getCount = function() {
  return this.view_ ? this.view_.length : this.source_.length;
};


/**
 * Adds all the items from the given collection
 * @param {Array.<T>|goog.structs.Collection.<T>} col The collection of things
 * to add
 */
os.structs.ArrayCollection.prototype.addAll = function(col) {
  var values = /** @type {Array.<T>} */ (goog.structs.getValues(col));
  var n = values.length;
  for (var i = 0; i < n; i++) {
    this.add(values[i]);
  }
};


/**
 * Removes all the items from the given collection
 * @param {Array.<T>|goog.structs.Collection.<T>} col The collection of things
 * to remove
 */
os.structs.ArrayCollection.prototype.removeAll = function(col) {
  var values = /** @type {Array.<T>} */ (goog.structs.getValues(col));
  var n = values.length;
  for (var i = 0; i < n; i++) {
    this.remove(values[i]);
  }
};


/**
 * Tests whether this collection contains all the values in the given
 * collection. Repeated elements in the collection are ignored, e.g. new
 * os.structs.ArrayCollection([1, 2]).containsAll([1, 1]) is true.
 * @param {Array.<T>|goog.structs.Collection.<T>} col The collection of things
 * to test
 * @return {boolean} True if the collection contains all the elements. False
 * otherwise.
 */
os.structs.ArrayCollection.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this);
};


/**
 * Gets the index in the array for the given item
 * @param {T} item The item
 * @return {number} The index of the item, or -1 if it could not be found
 */
os.structs.ArrayCollection.prototype.getItemIndex = function(item) {
  return this.getItemIndex_(item, this.getValues());
};


/**
 * Replace an item
 * @param {T} a The old item
 * @param {T} b The new item
 */
os.structs.ArrayCollection.prototype.replace = function(a, b) {
  if (a === b) {
    return;
  }

  var viewChanged = false;
  var sourceChanged = false;

  var i;
  if (this.view_) {
    i = this.getItemIndex_(a, this.view_);

    if (i > -1) {
      this.view_[i] = b;
      viewChanged = true;
    }
  }

  i = this.getItemIndex_(a, this.source_);

  if (i > -1) {
    this.source_[i] = b;
    sourceChanged = true;
  }

  this.viewChanged_ = this.viewChanged_ || viewChanged;
  this.sourceChanged_ = this.sourceChanged_ || sourceChanged;
  if (viewChanged || sourceChanged) {
    this.scheduleDataChanged();
  }
};


/**
 * @param {T} item The item to find
 * @param {?Array.<T>} arr The array to find it in
 * @return {number} The index in the array, or -1 if not found.
 * @private
 */
os.structs.ArrayCollection.prototype.getItemIndex_ = function(item, arr) {
  if (!arr) {
    return -1;
  }

  var i = this.sort_ ?
      goog.array.binarySearch(arr, item, this.sort_) : arr.indexOf(item);

  // the binary search method can return -2, which we're going to ignore
  return Math.max(i, -1);
};


/**
 * Schedules a data changed event
 * @protected
 */
os.structs.ArrayCollection.prototype.scheduleDataChanged = function() {
  if (this.delay_) {
    this.delay_.start();
  } else {
    this.onTimer_();
  }
};


/**
 * Handles the data change timer
 * @param {?goog.events.Event=} opt_e The optional event
 * @private
 */
os.structs.ArrayCollection.prototype.onTimer_ = function(opt_e) {
  if (this.delay_) {
    this.delay_.stop();
  }

  if (this.sourceChanged_) {
    // if source changes, so does view
    this.dispatchEvent(new goog.events.Event(os.structs.EventType.SOURCE_DATA_CHANGED));
    this.dispatchEvent(new goog.events.Event(os.structs.EventType.VIEW_DATA_CHANGED));
  } else if (this.viewChanged_) {
    // source remains, but view changed
    this.dispatchEvent(new goog.events.Event(os.structs.EventType.VIEW_DATA_CHANGED));
  }

  this.viewChanged_ = false;
  this.sourceChange_ = false;
};


// ****** goog.structs.* impl ******
//
// TODO: You could make an argument that the goog.structs.* functions should
// operate (or at least have the option to operate) over the source rather
// than the view when applicable. In order to do that, we would need to
// implement a flag and re-implement each function here or modify the behavior
// of getValues().


/**
 * This doesn't make any sense for array-based collections
 * @return {undefined}
 */
os.structs.ArrayCollection.prototype.getKeys = function() {
  return undefined;
};


/**
 * Gets all the items in the collection.  This will not include filtered items.
 * @return {!Array.<T>}
 */
os.structs.ArrayCollection.prototype.getValues = function() {
  return this.view_ || this.source_;
};


/**
 * Removes all the elements from the collection
 */
os.structs.ArrayCollection.prototype.clear = function() {
  this.source_.length = 0;

  if (this.view_) {
    this.view_.length = 0;
  }
};


/**
 * Whether or not the collection is empty
 * @return {boolean} True if the collection is emtpy, false otherwise.
 */
os.structs.ArrayCollection.prototype.isEmpty = function() {
  return this.getValues().length === 0;
};
