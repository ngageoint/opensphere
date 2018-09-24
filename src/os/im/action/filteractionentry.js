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
        this.actions[i].execute(items);
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

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionEntry.prototype.restore = function(config) {
  os.im.action.FilterActionEntry.base(this, 'restore', config);

  this.actions.length = 0;

  var actions = /** @type {Array<!Object>|undefined} */ (config['actions']);
  if (actions) {
    var iam = os.im.action.ImportActionManager.getInstance();
    for (var i = 0; i < actions.length; i++) {
      var actionConfig = actions[i];
      var action = iam.createAction(actionConfig['id'], actionConfig);
      if (action) {
        this.actions.push(action);
      }
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
