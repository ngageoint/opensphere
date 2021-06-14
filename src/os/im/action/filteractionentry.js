goog.module('os.im.action.FilterActionEntry');
goog.module.declareLegacyNamespace();

const functions = goog.require('goog.functions');
const FilterEntry = goog.require('os.filter.FilterEntry');
const fn = goog.require('os.ui.filter.fn');
const IComparable = goog.requireType('os.IComparable');
const ImportActionCallbackConfig = goog.requireType('os.im.action.ImportActionCallbackConfig');

const IImportAction = goog.requireType('os.im.action.IImportAction');


/**
 * Filter entry that performs actions on matched data.
 *
 * @implements {IComparable<FilterActionEntry>}
 * @unrestricted
 * @template T
 */
class FilterActionEntry extends FilterEntry {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setTitle('New Filter Action');

    /**
     * The import actions to perform on match.
     * @type {!Array<!IImportAction<T>>}
     */
    this.actions = [];

    /**
     * The filter function.
     * @type {!fn.FilterFn}
     * @protected
     */
    this.filterFn = functions.FALSE;

    /**
     * Function to get values from items.
     * @type {fn.ValueGetter|undefined}
     * @protected
     */
    this.filterGetter = undefined;

    /**
     * The entry's parent
     * @type {?FilterActionEntry}
     * @private
     */
    this.parent_ = null;

    /**
     * The entry's children.
     * @type {?Array<!FilterActionEntry>}
     * @private
     */
    this.children_ = null;
  }

  /**
   * @inheritDoc
   */
  setFilter(filter) {
    super.setFilter(filter);

    this.filterFn = fn.createFromEntry(this, this.filterGetter);
  }

  /**
   * Reset the features passed in
   *
   * @param {Array<T>} items The items.
   * @return {Array<ImportActionCallbackConfig>}
   */
  unprocessItems(items) {
    var configs = null;
    if (items) {
      configs = [];

      for (var i = 0; i < this.actions.length; i++) {
        var config = this.actions[i].reset(items);
        if (config) {
          configs.push(config);
        }

        // unapply children to each item that passed the filter
        var children = this.getChildren();
        if (children) {
          for (var j = 0, jj = children.length; j < jj; j++) {
            var cfgs = children[j].unprocessItems(items);
            if (cfgs) {
              cfgs.forEach((cfg) => {
                configs.push(cfg);
              });
            }
          }
        }
      }
    }
    return configs;
  }

  /**
   * Execute actions on items that match the filter.
   * @param {Array<T>} items The items.
   * @return {Array<ImportActionCallbackConfig>}
   */
  processItems(items) {
    var configs = null;
    if (items) {
      items = items.filter(this.filterFn);

      // apply to applicable items
      if (items.length > 0) {
        configs = [];

        for (var i = 0; i < this.actions.length; i++) {
          var config = this.actions[i].execute(items);
          if (config) {
            configs.push(config);
          }

          // apply children to each item that passed the filter
          var children = this.getChildren();
          if (children) {
            for (var j = 0, jj = children.length; j < jj; j++) {
              if (children[j].isEnabled()) {
                var cfgs = children[j].processItems(items);
                if (cfgs) {
                  cfgs.forEach((cfg) => {
                    configs.push(cfg);
                  });
                }
              }
            }
          }
        }
      }
    }
    return configs;
  }

  /**
   * Update all of the items. This will execute actions on items that now pass and reset items that don't.
   *
   * @param {Array<T>} items The items.
   */
  updateItems(items) {
    if (items) {
      var pass = [];
      var fail = [];
      items.forEach(function(item) {
        this.filterFn(item) ? pass.push(item) : fail.push(item);
      }, this);

      // apply to applicable items
      if (pass.length > 0 || fail.length > 0) {
        for (var i = 0; i < this.actions.length; i++) {
          this.actions[i].execute(pass);
          this.actions[i].reset(fail);

          // apply children to each item that passed the filter
          var children = this.getChildren();
          if (children) {
            for (var j = 0, jj = children.length; j < jj; j++) {
              if (children[j].isEnabled()) {
                children[j].processItems(pass);
              }
            }
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  setType(value) {
    super.setType(value);

    // update all the children to be of the same type
    var children = this.getChildren();
    if (children) {
      children.forEach(function(child) {
        child.setType(value);
      });
    }
  }

  /**
   * Adds a child to the entry if it isn't already a child.
   *
   * @param {!FilterActionEntry} child The child entry to add
   * @param {number=} opt_index Position to insert the child into. If -1 the child will be added
   *    to the end of the children.
   * @return {FilterActionEntry} The added child. May be the passed child, a reference to a matching
   *     child, or null if the add failed.
   */
  addChild(child, opt_index) {
    if (!this.children_) {
      this.children_ = [];
    }

    var hasChild = this.children_.indexOf(child) > -1;
    if (!hasChild) {
      // insert at the specified index, or at the end if unspecified
      var index = opt_index != null ? opt_index : this.children_.length;
      goog.array.insertAt(this.children_, child, index);
      child.setParent(this);

      return child;
    }

    return null;
  }

  /**
   * Removes a child from the entry.
   *
   * @param {!FilterActionEntry} child The child to remove.
   * @return {?FilterActionEntry} The entry that was removed or null if it was not found.
   */
  removeChild(child) {
    if (this.children_) {
      var index = this.children_.indexOf(child);
      if (index > -1) {
        if (child.getParent() === this) {
          child.setParent(null);
        }

        this.children_.splice(index, 1);

        if (this.children_.length === 0) {
          this.children_ = null;
        }

        return child;
      }
    }

    return null;
  }

  /**
   * Gets the parent entry.
   *
   * @return {?FilterActionEntry} The parent entry, or null if there is no parent.
   */
  getParent() {
    return this.parent_;
  }

  /**
   * Sets the parent entry.
   *
   * @param {FilterActionEntry} value The parent to set.
   */
  setParent(value) {
    if (this.parent_ !== value) {
      this.parent_ = value;

      if (this.parent_) {
        this.parent_.addChild(this, 0);
      }
    }
  }

  /**
   * Gets the children of the entry.
   *
   * @return {?Array<!FilterActionEntry>} The children.
   */
  getChildren() {
    return this.children_;
  }

  /**
   * Sets the children of the entry.
   *
   * @param {?Array<!FilterActionEntry>} value The children to set.
   */
  setChildren(value) {
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
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to) || {};

    opt_to['actions'] = this.actions.map(function(action) {
      return action.persist();
    });

    if (this.children_) {
      opt_to['children'] = this.children_.map(function(child) {
        return child.persist();
      });
    }

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
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
  }

  /**
   * Compare two filter actions by name, actions length, actions, and filter
   *
   * @inheritDoc
   */
  compare(other) {
    var val = 0;
    var thisTitle = this.getTitle();
    var thatTitle = other.getTitle();
    val = thisTitle < thatTitle ? -1 : thisTitle > thatTitle ? 1 : 0;

    if (val == 0) {
      var thisTags = this.getTags();
      var thatTags = other.getTags();
      val = thisTags < thatTags ? -1 : thisTags > thatTags ? 1 : 0;
    }

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

        if (val !== 0) {
          break;
        }
      }
    }

    if (val == 0) {
      var thisFilter = this.getFilter();
      var thatFilter = other.getFilter();
      val = thisFilter < thatFilter ? -1 : thisFilter > thatFilter ? 1 : 0;
    }

    return val;
  }
}

exports = FilterActionEntry;
