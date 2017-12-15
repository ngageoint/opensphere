goog.provide('os.ui.filter.op.EqualTo');

goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsEqualTo' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.EqualTo = function() {
  os.ui.filter.op.EqualTo.base(this, 'constructor',
      'PropertyIsEqualTo', 'is equal to', '=');
};
goog.inherits(os.ui.filter.op.EqualTo, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.EqualTo.prototype.getEvalExpression = function(varName, literal) {
  if (literal != null) {
    return varName + '==' + os.ui.filter.string.quoteString(literal);
  }

  // null is not supported, so don't return an expression
  return '';
};
