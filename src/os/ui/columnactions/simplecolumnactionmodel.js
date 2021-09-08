goog.module('os.ui.columnactions.SimpleColumnActionModel');

const IColumnActionModel = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * @implements {IColumnActionModel}
 */
class SimpleColumnActionModel {
  /**
   * Constructor.
   * @param {!string} field The field
   */
  constructor(field) {
    /**
     * @type {string}
     * @private
     */
    this.field_ = field;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.field_;
  }

  /**
   * @inheritDoc
   */
  getDataField() {
    return this.field_;
  }
}

exports = SimpleColumnActionModel;
