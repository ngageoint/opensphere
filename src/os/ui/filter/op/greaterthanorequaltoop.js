goog.module('os.ui.filter.op.GreaterThanOrEqualTo');
goog.module.declareLegacyNamespace();

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsGreaterThanOrEqualTo' operation class.
 */
class GreaterThanOrEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsGreaterThanOrEqualTo', 'is greater than or equal to', '>=');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '>=' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = GreaterThanOrEqualTo;
