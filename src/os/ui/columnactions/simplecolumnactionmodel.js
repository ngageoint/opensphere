goog.provide('os.ui.columnactions.SimpleColumnActionModel');
goog.require('os.ui.columnactions.IColumnActionModel');



/**
 * @param {!string} field The field
 * @implements {os.ui.columnactions.IColumnActionModel}
 * @constructor
 */
os.ui.columnactions.SimpleColumnActionModel = function(field) {
  /**
   * @type {string}
   * @private
   */
  this.field_ = field;
};


/**
 * @inheritDoc
 */
os.ui.columnactions.SimpleColumnActionModel.prototype.getTitle = function() {
  return this.field_;
};


/**
 * @inheritDoc
 */
os.ui.columnactions.SimpleColumnActionModel.prototype.getDataField = function() {
  return this.field_;
};
