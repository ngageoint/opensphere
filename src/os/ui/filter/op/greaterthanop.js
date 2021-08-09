goog.module('os.ui.filter.op.GreaterThan');
goog.module.declareLegacyNamespace();

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsGreaterThan' operation class.
 */
class GreaterThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsGreaterThan', 'is greater than', '>');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '>' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = GreaterThan;
