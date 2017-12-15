goog.provide('os.ui.slick.SlickColumnActionModel');
goog.require('os.ui.columnactions.IColumnActionModel');



/**
 * @param {Object.<string, *>} columnDef
 * @param {string=} opt_field The field, used for cases where the column definition should be overridden
 * @implements {os.ui.columnactions.IColumnActionModel}
 * @constructor
 */
os.ui.slick.SlickColumnActionModel = function(columnDef, opt_field) {
  /**
   * @type {Object<string, *>}
   * @private
   */
  this.columnDef_ = columnDef;

  /**
   * @type {string|undefined}
   * @private
   */
  this.field_ = opt_field;
};


/**
 * @inheritDoc
 */
os.ui.slick.SlickColumnActionModel.prototype.getTitle = function() {
  return this.field_ || /** @type {string} */ (this.columnDef_['name']);
};


/**
 * @inheritDoc
 */
os.ui.slick.SlickColumnActionModel.prototype.getDataField = function() {
  return this.field_ || /** @type {string} */ (this.columnDef_['field']);
};
