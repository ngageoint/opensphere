goog.module('os.ui.filter.op.LessThanOrEqualTo');

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsLessThanOrEqualTo' operation class.
 */
class LessThanOrEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsLessThanOrEqualTo', 'is less than or equal to', '<=');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '<=' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = LessThanOrEqualTo;
