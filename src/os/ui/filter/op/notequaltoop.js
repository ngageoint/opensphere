goog.module('os.ui.filter.op.NotEqualTo');

const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsNotEqualTo' operation class.
 */
class NotEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'PropertyIsNotEqualTo',
        'is not equal to',
        '!=',
        undefined,
        undefined,
        'e.g. Abc' + Op.TEXT.CASE_SENSITIVE,
        undefined,
        undefined,
        Op.TEXT.CASE_SENSITIVE_TITLE,
        Op.TEXT.CASE_SENSITIVE_DETAIL
    );
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (literal != null) {
      return varName + '!=' + quoteString(literal);
    }

    // null is not supported, so don't return an expression
    return '';
  }
}

exports = NotEqualTo;
