goog.provide('os.ui.filter.op.time.NewerThan');

goog.require('goog.string');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.op.time.newerOlderThanDirective');
goog.require('os.ui.filter.string');


/**
 * Operator for times newer than a set value.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.time.NewerThan = function() {
  os.ui.filter.op.time.NewerThan.base(this, 'constructor', 'PropertyIsLessThan', 'newer than', '<', ['recordtime'],
      'hint="newer"', 'find records newer than this', 'newerolderthan');
  this.matchHint = 'newer';
};
goog.inherits(os.ui.filter.op.time.NewerThan, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.time.NewerThan.prototype.getEvalExpression = function(varName, literal) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(literal))) {
    // the value stored in the variable for a time-based operator is an {@link os.time.ITime}
    // to execute the filter, we need to extract the raw time value and compare it to now
    return varName + '!=null&&currentFilterTimestamp-' + literal + '<' + varName + '.getEnd()';
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};
