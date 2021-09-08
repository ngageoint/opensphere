goog.module('os.ui.columnactions.ColumnActionEvent');

const GoogEvent = goog.require('goog.events.Event');

const IColumnActionModel = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * Handle a column action event
 */
class ColumnActionEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {!Object.<string, *>} context
   * @param {!IColumnActionModel} column
   * @param {?*} value
   * @param {Object=} opt_target
   */
  constructor(type, context, column, value, opt_target) {
    super(type, opt_target);

    /**
     * @type {!Object.<string, *>}
     * @private
     */
    this.context_ = context;

    /**
     * @type {!IColumnActionModel}
     * @private
     */
    this.column_ = column;

    /**
     * @type {?*}
     * @private
     */
    this.value_ = value;
  }

  /**
   * @return {Object.<string, *>}
   */
  getContext() {
    return this.context_;
  }

  /**
   * @return {IColumnActionModel}
   */
  getColumn() {
    return this.column_;
  }

  /**
   * @return {*}
   */
  getValue() {
    return this.value_;
  }
}

exports = ColumnActionEvent;
