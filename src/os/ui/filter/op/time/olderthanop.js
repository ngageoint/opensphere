goog.module('os.ui.filter.op.time.OlderThan');
goog.module.declareLegacyNamespace();

const googString = goog.require('goog.string');
const Op = goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.op.time.newerOlderThanDirective');


goog.require('os.ui.filter.string');

/**
 * Operator for times older than a set value.
 */
class OlderThan extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
      'PropertyIsGreaterThan',
      'older than',
      '>',
      ['recordtime'],
      'hint="older"',
      'Find records older than this',
      'newerolderthan'
    );
    this.matchHint = 'older';
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!googString.isEmptyOrWhitespace(googString.makeSafe(literal))) {
      // the value stored in the variable for a time-based operator is an {@link os.time.ITime}
      // to execute the filter, we need to extract the raw time value and compare it to now
      return varName + '!=null&&currentFilterTimestamp-' + literal + '>' + varName + '.getStart()';
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}

exports = OlderThan;
