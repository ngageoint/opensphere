goog.provide('os.ui.filter.op.LessThanOrEqualTo');

goog.require('goog.string');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsLessThanOrEqualTo' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.LessThanOrEqualTo = function() {
  os.ui.filter.op.LessThanOrEqualTo.base(this, 'constructor',
      'PropertyIsLessThanOrEqualTo', 'is less than or equal to', '<=');
};
goog.inherits(os.ui.filter.op.LessThanOrEqualTo, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.LessThanOrEqualTo.prototype.getEvalExpression = function(varName, literal) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(literal))) {
    return varName + '<=' + os.ui.filter.string.quoteString(literal);
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};
