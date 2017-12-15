goog.provide('os.im.action.FilterActionEntry');

goog.require('goog.functions');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.fn');



/**
 * Filter entry that performs actions on matched data.
 * @extends {os.filter.FilterEntry}
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
 * Execute actions on items that match the filter.
 * @param {Array<T>} items The items.
 */
os.im.action.FilterActionEntry.prototype.processItems = function(items) {
  if (items) {
    items = items.filter(this.filterFn);

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
 * Static function to test for enabled filter action entries.
 * @param {os.im.action.FilterActionEntry} entry The entry.
 * @return {boolean} If the entry is enabled.
 */
os.im.action.testFilterActionEnabled = function(entry) {
  return entry.isEnabled();
};
