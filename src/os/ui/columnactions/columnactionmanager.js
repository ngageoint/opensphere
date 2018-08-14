goog.provide('os.ui.columnactions.ColumnActionManager');

goog.require('goog.events.EventTarget');
goog.require('os.ui.columnactions.actions.UrlColumnAction');
goog.require('os.ui.columnactions.launchColumnActionPrompt');


/**
 * Global manager reference.  Set this in each application with the app-specific manager reference
 * @type {os.ui.columnactions.ColumnActionManager}
 */
os.ui.columnActionManager = null;


/**
 * Typedef for column action formatter functions.
 * @typedef {function(number, number, string, Object, os.ui.slick.SlickTreeNode, boolean=):string}
 */
os.ui.columnactions.ColumnActionFormatterFn;



/**
 * Provide registry for column actions.
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.columnactions.ColumnActionManager = function() {
  os.ui.columnactions.ColumnActionManager.base(this, 'constructor');

  /**
   * The registry of column action entries.
   * @type {!Object<string, !os.ui.columnactions.AbstractColumnAction>}
   * @private
   */
  this.actionEntries_ = {};
  this.init_();
};
goog.inherits(os.ui.columnactions.ColumnActionManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.columnactions.ColumnActionManager);


/**
 * The settings keys for columnActions
 * @const
 * @type {string}
 */
os.ui.columnactions.ColumnActionManager.KEY = 'columnActions';


/**
 * The action event string for performing column actions
 * @const
 * @type {string}
 */
os.ui.columnactions.ColumnActionManager.PERFORM_COLUMN_ACTION = 'PERFORM_COLUMN_ACTION';


/**
 * Get includes from settings
 * @private
 */
os.ui.columnactions.ColumnActionManager.prototype.init_ = function() {
  var includes = /** @type {Object<string, Object>|undefined} */ (os.settings.get(
      os.ui.columnactions.ColumnActionManager.KEY));

  if (includes) {
    for (var key in includes) {
      var columnAction = os.ui.columnactions.ColumnActionManager.getFromConfig(includes[key], key);
      if (columnAction) {
        this.actionEntries_[key] = columnAction;
      }
    }
  }
};


/**
 * @param {Object<string, *>} context
 * @param {os.ui.columnactions.IColumnActionModel} column
 * @param {?*} value
 * @return {!Array<!os.ui.columnactions.AbstractColumnAction>}
 */
os.ui.columnactions.ColumnActionManager.prototype.getActions = function(context, column, value) {
  var matched = [];
  for (var key in this.actionEntries_) {
    var columnAction = this.actionEntries_[key];
    if (columnAction && columnAction.matches(context, column, value)) {
      matched.push(columnAction);
    }
  }

  return matched;
};


/**
 * @param {Object<string, *>} context
 * @param {os.ui.columnactions.IColumnActionModel} column
 * @param {?*} value
 * @return {number}
 */
os.ui.columnactions.ColumnActionManager.prototype.numActions = function(context, column, value) {
  return this.getActions(context, column, value).length;
};


/**
 * @param {*} event
 */
os.ui.columnactions.ColumnActionManager.prototype.onColumnActionEvent = function(event) {
  var value = event.getValue();
  var matched = this.getActions(event.getContext(), event.getColumn(), value);
  var colDef = event.getColumn();
  os.ui.columnactions.launchColumnActionPrompt(matched, value, colDef);
};


/**
 *
 * @param {Object<string, *>} include
 * @param {string} index
 * @return {os.ui.columnactions.AbstractColumnAction|undefined}
 */
os.ui.columnactions.ColumnActionManager.getFromConfig = function(include, index) {
  var ca;
  if (include) {
    var type = include['type'];
    switch (type) {
      case 'url':
        ca = new os.ui.columnactions.actions.UrlColumnAction();
        ca.setRegExps(/** @type {?Object<string, string>} */(include['regex']));
        ca.setDescription(/** @type {string} */ (include['description']));
        ca.setAction(include['action']);
        break;
      default:
        break;
    }
  }

  return ca;
};
