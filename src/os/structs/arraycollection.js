goog.module('os.structs.ArrayCollection');
goog.module.declareLegacyNamespace();

const {binaryInsert, binaryRemove, binarySearch} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const {every, getValues} = goog.require('goog.structs');
const EventType = goog.require('os.structs.EventType');

const Collection = goog.requireType('goog.structs.Collection');


/**
 * A collection of items in an array. The array is always kept sorted and
 * filtered by the given functions. The key advantage of this class over simply
 * using <code>Array</code> with {@link goog.structs} calls is that it
 * keeps the collection sorted and filtered as items are added and removed
 * without having to re-filter or re-sort the entire collection.
 *
 * @implements {Collection}
 * @template T
 */
class ArrayCollection extends EventTarget {
  /**
   * Constructor.
   * @param {?Array<T>=} opt_source An optional array of elements to populate
   *    the collection.
   */
  constructor(opt_source) {
    super();

    /**
     * A timer that helps pool changed events
     * @type {?Delay}
     * @private
     */
    this.delay_ = null;

    /**
     * The source array
     * @type {!Array<T>}
     * @private
     */
    this.source_ = opt_source || [];

    /**
     * Indicates the raw data has changed in the source array
     * @type {boolean}
     * @private
     */
    this.sourceChanged_ = false;

    /**
     * The view array
     * @type {?Array<T>}
     * @private
     */
    this.view_ = null;

    /**
     * Indicates the view array has changed
     * @type {boolean}
     * @private
     */
    this.viewChanged_ = false;

    /**
     * The sort for the array
     * @type {?function(?, ?):!number|undefined}
     * @private
     */
    this.sort_ = null;

    /**
     * Whether or not the sort has changed
     * @type {boolean}
     * @private
     */
    this.sortChanged_ = false;

    /**
     * The filter for the array
     * @type {?function(*, number, Array): boolean}
     * @private
     */
    this.filter_ = null;

    /**
     * The scope in which to run the filter
     * @type {*}
     * @private
     */
    this.filterScope_ = null;

    /**
     * Whether or not the filter has changed
     * @type {boolean}
     * @private
     */
    this.filterChanged_ = false;
  }

  /**
   * Sets the delay for the {@link EventType}
   * to fire. If the value is set to 0 or less, the event is dispatched on every
   * add, remove, and refresh. If set to greater than 0, a timer will run and be
   * reset on every add, remove, and refresh. The
   * {@link os.structs.EventType} event will fire when the
   * timer completes
   *
   * @param {number} value The interval in ms
   */
  setChangeDelay(value) {
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

      this.delay_ = new Delay(this.onTimer_, value, this);
    }
  }

  /**
   * Gets the source array which contains all items without filters
   *
   * @return {Array<T>}
   */
  getSourceValues() {
    return this.source_;
  }

  /**
   * Gets the filter for the collection.
   *
   * @return {?function(*, number, Array): boolean}
   */
  getFilter() {
    return this.filter_;
  }

  /**
   * Sets the filter for the collection. Use <code>refresh()</code> to apply the
   * changes.
   *
   * @param {?function(*, number, Array): boolean} filter The filter
   * @param {*=} opt_this The scope in which to run the filter
   * @see {@link os.structs.ArrayCollection.prototype.refresh}
   */
  setFilter(filter, opt_this) {
    this.filterChanged_ = filter !== this.filter_;
    this.filter_ = filter;
    this.filterScope_ = opt_this;
    if (this.filter_ && !this.view_) {
      this.view_ = [];
    }
  }

  /**
   * Gets the sort for the collection
   *
   * @return {?function(?, ?):!number|undefined} The sort function for the
   * collection
   */
  getSort() {
    return this.sort_;
  }

  /**
   * Sets the sort for the collection. Use <code>refresh()</code> to apply the
   * changes.
   *
   * @param {?function(?, ?):!number|undefined} sort The sort function
   * @see {@link os.structs.ArrayCollection.prototype.refresh}
   */
  setSort(sort) {
    this.sortChanged_ = sort !== this.sort_;
    this.sort_ = sort;
  }

  /**
   * Refresh the collection. If the sort or filter has changed, this will re-sort
   * and re-filter the collection before dispatching a refresh event to the view.
   */
  refresh() {
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
  }

  /**
   * @inheritDoc
   */
  add(item) {
    /** @type {boolean} */ var addedToView = false;
    if (this.sort_) {
      binaryInsert(this.source_, item, this.sort_);
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
  }

  /**
   * Adds items to the filtered view
   *
   * @param {T} item The item to add
   * @return {boolean} True if the item was added to the view, false otherwise.
   * @private
   */
  addFiltered_(item) {
    /** @type {boolean} */ var val = true;
    if (this.filter_) {
      if (this.filter_.call(this.filterScope_, item, -1, null)) {
        if (this.sort_) {
          binaryInsert(this.view_, item, this.sort_);
        } else {
          this.view_.push(item);
        }
      } else {
        val = false;
      }
    }

    return val;
  }

  /**
   * @inheritDoc
   */
  remove(item) {
    /** @type {boolean} */ var removedFromView = false;

    if (this.sort_) {
      binaryRemove(this.source_, item, this.sort_);
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
    this.sourceChanged_ = true;
    this.scheduleDataChanged();
  }

  /**
   * Removes the item at the specified index
   *
   * @param {number} index The index to remove
   * @param {boolean=} opt_source Whether or not the index references the source
   * @return {?T} The removed element, or null if not found
   */
  removeAt(index, opt_source) {
    /** @type {Array<T>} */
    var list = opt_source ? this.source_ : this.view_ || this.source_;

    /** @type {?T} */
    var item = null;
    if (index > -1 && index < list.length) {
      item = list.splice(index, 1)[0];
    }

    return item;
  }

  /**
   * Removes an item from the filtered view
   *
   * @param {T} item The item to remove
   * @return {boolean} True if the item was removed from the view, false
   * otherwise.
   * @private
   */
  removeFiltered_(item) {
    /** @type {boolean} */ var val = false;
    if (this.filter_) {
      if (this.sort_) {
        val = binaryRemove(
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
  }

  /**
   * @inheritDoc
   */
  contains(item) {
    return this.getItemIndex(item) > -1;
  }

  /**
   * @inheritDoc
   */
  getCount() {
    return this.view_ ? this.view_.length : this.source_.length;
  }

  /**
   * Adds all the items from the given collection
   *
   * @param {Array<T>|Collection<T>} col The collection of things
   * to add
   */
  addAll(col) {
    var values = /** @type {Array<T>} */ (getValues(col));
    var n = values.length;
    for (var i = 0; i < n; i++) {
      this.add(values[i]);
    }
  }

  /**
   * Removes all the items from the given collection
   *
   * @param {Array<T>|Collection<T>} col The collection of things
   * to remove
   */
  removeAll(col) {
    var values = /** @type {Array<T>} */ (getValues(col));
    var n = values.length;
    for (var i = 0; i < n; i++) {
      this.remove(values[i]);
    }
  }

  /**
   * Tests whether this collection contains all the values in the given
   * collection. Repeated elements in the collection are ignored, e.g. new
   * os.structs.ArrayCollection([1, 2]).containsAll([1, 1]) is true.
   *
   * @param {Array<T>|Collection<T>} col The collection of things
   * to test
   * @return {boolean} True if the collection contains all the elements. False
   * otherwise.
   */
  containsAll(col) {
    return every(col, this.contains, this);
  }

  /**
   * Gets the index in the array for the given item
   *
   * @param {T} item The item
   * @return {number} The index of the item, or -1 if it could not be found
   */
  getItemIndex(item) {
    return this.getItemIndex_(item, this.getValues());
  }

  /**
   * Replace an item
   *
   * @param {T} a The old item
   * @param {T} b The new item
   */
  replace(a, b) {
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
  }

  /**
   * @param {T} item The item to find
   * @param {?Array<T>} arr The array to find it in
   * @return {number} The index in the array, or -1 if not found.
   * @private
   */
  getItemIndex_(item, arr) {
    if (!arr) {
      return -1;
    }

    var i = this.sort_ ?
      binarySearch(arr, item, this.sort_) : arr.indexOf(item);

    // the binary search method can return -2, which we're going to ignore
    return Math.max(i, -1);
  }

  /**
   * Schedules a data changed event
   *
   * @protected
   */
  scheduleDataChanged() {
    if (this.delay_) {
      this.delay_.start();
    } else {
      this.onTimer_();
    }
  }

  /**
   * Handles the data change timer
   *
   * @param {?GoogEvent=} opt_e The optional event
   * @private
   */
  onTimer_(opt_e) {
    if (this.delay_) {
      this.delay_.stop();
    }

    if (this.sourceChanged_) {
      // if source changes, so does view
      this.dispatchEvent(new GoogEvent(EventType.SOURCE_DATA_CHANGED));
      this.dispatchEvent(new GoogEvent(EventType.VIEW_DATA_CHANGED));
    } else if (this.viewChanged_) {
      // source remains, but view changed
      this.dispatchEvent(new GoogEvent(EventType.VIEW_DATA_CHANGED));
    }

    this.viewChanged_ = false;
    this.sourceChanged_ = false;
  }

  // ****** goog.structs.* impl ******
  //
  // TODO: You could make an argument that the goog.structs.* functions should
  // operate (or at least have the option to operate) over the source rather
  // than the view when applicable. In order to do that, we would need to
  // implement a flag and re-implement each function here or modify the behavior
  // of getValues().


  /**
   * This doesn't make any sense for array-based collections
   *
   * @return {undefined}
   */
  getKeys() {
    return undefined;
  }

  /**
   * Gets all the items in the collection.  This will not include filtered items.
   *
   * @return {!Array<T>}
   */
  getValues() {
    return this.view_ || this.source_;
  }

  /**
   * Removes all the elements from the collection
   */
  clear() {
    this.source_.length = 0;

    if (this.view_) {
      this.view_.length = 0;
    }
  }

  /**
   * Whether or not the collection is empty
   *
   * @return {boolean} True if the collection is emtpy, false otherwise.
   */
  isEmpty() {
    return this.getValues().length === 0;
  }
}

exports = ArrayCollection;
