goog.module('os.ui.slick.SlickColumnActionModel');

const IColumnActionModel = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * @implements {IColumnActionModel}
 */
class SlickColumnActionModel {
  /**
   * Constructor.
   * @param {Object<string, *>} columnDef
   * @param {string=} opt_field The field, used for cases where the column definition should be overridden
   */
  constructor(columnDef, opt_field) {
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
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.field_ || /** @type {string} */ (this.columnDef_['name']);
  }

  /**
   * @inheritDoc
   */
  getDataField() {
    return this.field_ || /** @type {string} */ (this.columnDef_['field']);
  }
}

exports = SlickColumnActionModel;
