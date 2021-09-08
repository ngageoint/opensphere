goog.module('os.ui.filter.op.EqualTo');

const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsEqualTo' operation class.
 */
class EqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'PropertyIsEqualTo',
        'is equal to',
        '=',
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
      return varName + '==' + quoteString(literal);
    }

    // null is not supported, so don't return an expression
    return '';
  }
}

exports = EqualTo;
