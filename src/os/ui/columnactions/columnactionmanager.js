goog.declareModuleId('os.ui.columnactions.ColumnActionManager');

import Settings from '../../config/settings.js';
import UrlColumnAction from './actions/urlcolumnaction.js';
import launchColumnActionPrompt from './launchcolumnactionprompt.js';

const EventTarget = goog.require('goog.events.EventTarget');

const {default: AbstractColumnAction} = goog.requireType('os.ui.columnactions.AbstractColumnAction');
const {default: IColumnActionModel} = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * Provide registry for column actions.
 */
export default class ColumnActionManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The registry of column action entries.
     * @type {!Object<string, !AbstractColumnAction>}
     * @private
     */
    this.actionEntries_ = {};
    this.init_();
  }

  /**
   * Get includes from settings
   *
   * @private
   */
  init_() {
    var includes = /** @type {Object<string, Object>|undefined} */ (Settings.getInstance().get(
        ColumnActionManager.KEY));

    if (includes) {
      for (var key in includes) {
        var columnAction = getFromConfig(includes[key], key);
        if (columnAction) {
          this.actionEntries_[key] = columnAction;
        }
      }
    }
  }

  /**
   * @param {Object<string, *>} context
   * @param {IColumnActionModel} column
   * @param {?*} value
   * @return {!Array<!AbstractColumnAction>}
   */
  getActions(context, column, value) {
    var matched = [];
    for (var key in this.actionEntries_) {
      var columnAction = this.actionEntries_[key];
      if (columnAction && columnAction.matches(context, column, value)) {
        matched.push(columnAction);
      }
    }

    return matched;
  }

  /**
   * @param {Object<string, *>} context
   * @param {IColumnActionModel} column
   * @param {?*} value
   * @return {number}
   */
  numActions(context, column, value) {
    return this.getActions(context, column, value).length;
  }

  /**
   * @param {*} event
   */
  onColumnActionEvent(event) {
    var value = event.getValue();
    var matched = this.getActions(event.getContext(), event.getColumn(), value);
    var colDef = event.getColumn();
    launchColumnActionPrompt(matched, value, colDef);
  }

  /**
   * Get the global instance.
   * @return {!ColumnActionManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new ColumnActionManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ColumnActionManager} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * The global instance.
 * @type {ColumnActionManager}
 */
let instance;

/**
 * @param {Object<string, *>} include
 * @param {string} index
 * @return {AbstractColumnAction|undefined}
 */
const getFromConfig = function(include, index) {
  var ca;
  if (include) {
    var type = include['type'];
    switch (type) {
      case 'url':
        ca = new UrlColumnAction();
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

/**
 * The settings keys for columnActions
 * @const
 * @type {string}
 */
ColumnActionManager.KEY = 'columnActions';

/**
 * The action event string for performing column actions
 * @const
 * @type {string}
 */
ColumnActionManager.PERFORM_COLUMN_ACTION = 'PERFORM_COLUMN_ACTION';
