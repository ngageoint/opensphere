goog.provide('os.im.action.FilterActionEntry');

goog.require('goog.functions');
goog.require('os.IComparable');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.fn');



/**
 * Filter entry that performs actions on matched data.
 * @extends {os.filter.FilterEntry}
 * @implements {os.IComparable<os.im.action.FilterActionEntry>}
 * @constructor
 * @template T
 */
os.im.action.FilterActionEntry = function() {
  os.im.action.FilterActionEntry.base(this, 'constructor');
  this.setTitle('New Filter Action');

  /**
   * The import actions to perform on match.
   * @type {!Array<!os.im.action.IImportAction<T>>}
   */
  this.actions = [];

  /**
   * The filter function.
   * @type {!os.ui.filter.fn.FilterFn}
   * @protected
   */
  this.filterFn = goog.functions.FALSE;

  /**
   * Function to get values from items.
   * @type {os.ui.filter.fn.ValueGetter|undefined}
   * @protected
   */
  this.filterGetter = undefined;

  /**
   * The entry's parent
   * @type {?os.im.action.FilterActionEntry}
   * @private
   */
  this.parent_ = null;

  /**
   * The entry's children.
   * @type {?Array<!os.im.action.FilterActionEntry>}
   * @private
   */
  this.children_ = null;
};
goog.inherits(os.im.action.FilterActionEntry, os.filter.FilterEntry);


/**
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.setFilter = function(filter) {
  os.im.action.FilterActionEntry.base(this, 'setFilter', filter);

  this.filterFn = os.ui.filter.fn.createFromEntry(this, this.filterGetter);
};


/**
 * Reset the features passed in
 * @param {string} entryType The entry type.
 * @param {Array<T>} items The items.
 */
os.im.action.FilterActionEntry.prototype.unprocessItems = function(entryType, items) {
  if (items) {
    items = items.filter(this.filterFn);

    for (var i = 0; i < this.actions.length; i++) {
      this.actions[i].reset(entryType, items);

      // unapply children to each item that passed the filter
      var children = this.getChildren();
      if (children) {
        for (var j = 0, jj = children.length; j < jj; j++) {
          children[j].unprocessItems(entryType, items);
        }
      }
    }
  }
};


/**
 * Execute actions on items that match the filter.
 * @param {string} entryType The entry type.
 * @param {Array<T>} items The items.
 */
os.im.action.FilterActionEntry.prototype.processItems = function(entryType, items) {
  if (items) {
    items = items.filter(this.filterFn);

    // apply to applicable items
    if (items.length > 0) {
      for (var i = 0; i < this.actions.length; i++) {
        this.actions[i].execute(entryType, items);

        // apply children to each item that passed the filter
        var children = this.getChildren();
        if (children) {
          for (var j = 0, jj = children.length; j < jj; j++) {
            if (children[j].isEnabled()) {
              children[j].processItems(entryType, items);
            }
          }
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.setType = function(value) {
  os.im.action.FilterActionEntry.base(this, 'setType', value);

  // update all the children to be of the same type
  var children = this.getChildren();
  if (children) {
    children.forEach(function(child) {
      child.setType(value);
    });
  }
};


/**
 * Adds a child to the entry if it isn't already a child.
 * @param {!os.im.action.FilterActionEntry} child The child entry to add
 * @param {number=} opt_index Position to insert the child into. If -1 the child will be added
 *    to the end of the children.
 * @return {os.im.action.FilterActionEntry} The added child. May be the passed child, a reference to a matching
 *     child, or null if the add failed.
 */
os.im.action.FilterActionEntry.prototype.addChild = function(child, opt_index) {
  if (!this.children_) {
    this.children_ = [];
  }

  var hasChild = this.children_.indexOf(child) > -1;
  if (!hasChild) {
    // insert at the specified index, or at the end if unspecified
    var index = opt_index != null ? opt_index : this.children_.length;
    goog.array.insertAt(this.children_, child, index);

    // this.initChild(child);

    child.setParent(this);

    return child;
  }

  return null;
};


/**
 * Removes a child from the entry.
 * @param {!os.im.action.FilterActionEntry} child The child to remove.
 * @return {?os.im.action.FilterActionEntry} The entry that was removed or null if it was not found.
 */
os.im.action.FilterActionEntry.prototype.removeChild = function(child) {
  if (this.children_) {
    var index = this.children_.indexOf(child);
    if (index > -1) {
      if (child.getParent() === this) {
        child.setParent(null);
      }

      this.children_.splice(index, 1);
      // this.destroyChild(child);

      if (this.children_.length === 0) {
        this.children_ = null;
      }

      return child;
    }
  }

  return null;
};


/**
 * Gets the parent entry.
 * @return {?os.im.action.FilterActionEntry} The parent entry, or null if there is no parent.
 */
os.im.action.FilterActionEntry.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Sets the parent entry.
 * @param {os.im.action.FilterActionEntry} value The parent to set.
 */
os.im.action.FilterActionEntry.prototype.setParent = function(value) {
  if (this.parent_ !== value) {
    this.parent_ = value;

    if (this.parent_) {
      this.parent_.addChild(this, 0);
    }
  }
};


/**
 * Gets the children of the entry.
 * @return {?Array<!os.im.action.FilterActionEntry>} The children.
 */
os.im.action.FilterActionEntry.prototype.getChildren = function() {
  return this.children_;
};


/**
 * Sets the children of the entry.
 * @param {?Array<!os.im.action.FilterActionEntry>} value The children to set.
 */
os.im.action.FilterActionEntry.prototype.setChildren = function(value) {
  if (value !== this.children_) {
    if (this.children_) {
      var i = this.children_.length;
      while (i--) {
        this.removeChild(this.children_[i]);
      }
    }

    if (value) {
      for (var i = 0, n = value.length; i < n; i++) {
        this.addChild(value[i]);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.persist = function(opt_to) {
  opt_to = os.im.action.FilterActionEntry.base(this, 'persist', opt_to) || {};

  opt_to['actions'] = this.actions.map(function(action) {
    return action.persist();
  });

  if (this.children_) {
    opt_to['children'] = this.children_.map(function(child) {
      return child.persist();
    });
  }

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.restore = function(config) {
  os.im.action.FilterActionEntry.base(this, 'restore', config);
  var iam = os.im.action.ImportActionManager.getInstance();

  this.actions.length = 0;

  var actions = /** @type {Array<!Object>|undefined} */ (config['actions']);
  if (actions) {
    for (var i = 0; i < actions.length; i++) {
      var actionConfig = actions[i];
      var action = iam.createAction(actionConfig['id'], actionConfig);
      if (action) {
        this.actions.push(action);
      }
    }
  }

  var children = /** @type {Array<!Object>|undefined} */ (config['children']);
  if (children) {
    this.children_ = [];
    for (var j = 0, jj = children.length; j < jj; j++) {
      var entryConfig = children[j];
      var entry = iam.createActionEntry();
      entry.restore(entryConfig);
      this.addChild(entry);
    }
  }
};


/**
 * Compare two filter actions by name, actions length, actions, and filter
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.compare = function(other) {
  var val = 0;
  var thisTitle = this.getTitle();
  var thatTitle = other.getTitle();
  val = thisTitle < thatTitle ? -1 : thisTitle > thatTitle ? 1 : 0;

  var thisTags = this.getTags();
  var thatTags = other.getTags();
  val = thisTags < thatTags ? -1 : thisTags > thatTags ? 1 : 0;

  var length = this.actions.length;
  if (val == 0) {
    val = length < other.actions.length ? -1 : length > other.actions.length ? 1 : 0;
  }

  if (val == 0) {
    // compare the important parts of the action by getting the toXml
    while (length--) {
      var thisComp = os.xml.serialize(this.actions[length].toXml());
      var thatComp = os.xml.serialize(other.actions[length].toXml());
      val = thisComp < thatComp ? -1 : thisComp > thatComp ? 1 : 0;
    }
  }

  if (val == 0) {
    var thisFilter = this.getFilter();
    var thatFilter = other.getFilter();
    val = thisFilter < thatFilter ? -1 : thisFilter > thatFilter ? 1 : 0;
  }

  return val;
};


/**
 * Static function to test for enabled filter action entries.
 * @param {os.im.action.FilterActionEntry} entry The entry.
 * @return {boolean} If the entry is enabled.
 */
os.im.action.testFilterActionEnabled = function(entry) {
  return entry.isEnabled();
};
