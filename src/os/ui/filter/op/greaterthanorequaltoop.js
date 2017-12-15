goog.provide('os.ui.filter.op.GreaterThanOrEqualTo');

goog.require('goog.string');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsGreaterThanOrEqualTo' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.GreaterThanOrEqualTo = function() {
  os.ui.filter.op.GreaterThanOrEqualTo.base(this, 'constructor',
      'PropertyIsGreaterThanOrEqualTo', 'is greater than or equal to', '>=');
};
goog.inherits(os.ui.filter.op.GreaterThanOrEqualTo, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.GreaterThanOrEqualTo.prototype.getEvalExpression = function(varName, literal) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(literal))) {
    return varName + '>=' + os.ui.filter.string.quoteString(literal);
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};
