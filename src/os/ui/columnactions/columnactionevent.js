goog.provide('os.ui.columnactions.ColumnActionEvent');
goog.require('goog.events.Event');



/**
 *
 * Handle a column action event
 *
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type
 * @param {!Object.<string, *>} context
 * @param {!os.ui.columnactions.IColumnActionModel} column
 * @param {?*} value
 * @param {Object=} opt_target
 *
 */
os.ui.columnactions.ColumnActionEvent = function(type, context, column, value, opt_target) {
  os.ui.columnactions.ColumnActionEvent.base(this, 'constructor', type, opt_target);

  /**
   * @type {!Object.<string, *>}
   * @private
   */
  this.context_ = context;

  /**
   * @type {!os.ui.columnactions.IColumnActionModel}
   * @private
   */
  this.column_ = column;

  /**
   * @type {?*}
   * @private
   */
  this.value_ = value;
};
goog.inherits(os.ui.columnactions.ColumnActionEvent, goog.events.Event);


/**
 * @return {Object.<string, *>}
 */
os.ui.columnactions.ColumnActionEvent.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {os.ui.columnactions.IColumnActionModel}
 */
os.ui.columnactions.ColumnActionEvent.prototype.getColumn = function() {
  return this.column_;
};


/**
 * @return {*}
 */
os.ui.columnactions.ColumnActionEvent.prototype.getValue = function() {
  return this.value_;
};
