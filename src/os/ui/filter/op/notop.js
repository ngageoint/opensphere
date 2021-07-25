goog.module('os.ui.filter.op.Not');
goog.module.declareLegacyNamespace();

const Op = goog.require('os.ui.filter.op.Op');


/**
 * @unrestricted
 */
class Not extends Op {
  /**
   * Constructor.
   * @param {Op} op
   */
  constructor(op) {
    super('Not', 'not');

    /**
     * @type {Op}
     * @protected
     */
    this.op = op;

    /**
     * @type {!string}
     */
    this['hint'] = op['hint'] || '';

    /**
     * @type {!string}
     */
    this['popoverTitle'] = op['popoverTitle'] || '';

    /**
     * @type {?string}
     */
    this['popoverContent'] = op['popoverContent'];
  }

  /**
   * @inheritDoc
   * @export
   */
  getTitle() {
    return this.op.getTitle().replace('is', 'is not');
  }

  /**
   * @inheritDoc
   * @export
   */
  getShortTitle() {
    return 'not ' + this.op.getShortTitle();
  }

  /**
   * @inheritDoc
   */
  getAttributes() {
    return this.op.getAttributes();
  }

  /**
   * @inheritDoc
   */
  setAttributes(attributes) {
    return this.op.setAttributes(attributes);
  }

  /**
   * @inheritDoc
   */
  getUi() {
    return this.op.getUi();
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    var opExpr = this.op.getEvalExpression(varName, literal);
    if (opExpr) {
      return '!(' + opExpr + ')';
    }

    return '';
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    var filter = this.op.getFilter(column, literal);
    return filter ? '<Not>' + filter + '</Not>' : '';
  }

  /**
   * @inheritDoc
   */
  getColumn(el) {
    return this.op.getColumn(el);
  }

  /**
   * @inheritDoc
   */
  getLiteral(el) {
    return this.op.getLiteral(el);
  }

  /**
   * @inheritDoc
   */
  matches(el) {
    return super.matches(el) &&
        el.children().length == 1 && this.op.matches(el.children().first());
  }

  /**
   * @inheritDoc
   */
  isSupported(type) {
    return this.op.isSupported(type);
  }

  /**
   * @inheritDoc
   */
  setSupported(types) {
    this.op.setSupported(types);
  }

  /**
   * @inheritDoc
   */
  validate(value, key) {
    return this.op.validate(value, key);
  }
}

exports = Not;
