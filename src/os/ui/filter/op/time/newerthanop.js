goog.module('os.ui.filter.op.time.NewerThan');

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
const {directiveTag} = goog.require('os.ui.filter.op.time.NewerOlderThanUI');


/**
 * Operator for times newer than a set value.
 */
class NewerThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsLessThan', 'newer than', '<', ['recordtime'], 'hint="newer"', 'find records newer than this',
        directiveTag);
    this.matchHint = 'newer';
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      // the value stored in the variable for a time-based operator is an {@link os.time.ITime}
      // to execute the filter, we need to extract the raw time value and compare it to now
      return varName + '!=null&&currentFilterTimestamp-' + literal + '<' + varName + '.getEnd()';
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = NewerThan;
