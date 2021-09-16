goog.module('os.ui.filter.op.LessThan');

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {quoteString} = goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsLessThan' operation class.
 */
class LessThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsLessThan', 'is less than', '<');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '<' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = LessThan;
