goog.provide('os.ui.filter.op.NotEqualTo');

goog.require('os.ui.filter.op.Op');


/**
 * A 'PropertyIsNotEqualTo' operation class.
 *
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.NotEqualTo = function() {
  os.ui.filter.op.NotEqualTo.base(this, 'constructor',
      'PropertyIsNotEqualTo', 'is not equal to', '!=',
      undefined, undefined, 'e.g. Abc' + os.ui.filter.op.Op.TEXT.CASE_SENSITIVE,
      undefined, undefined, os.ui.filter.op.Op.TEXT.CASE_SENSITIVE_TITLE,
      os.ui.filter.op.Op.TEXT.CASE_SENSITIVE_DETAIL);
};
goog.inherits(os.ui.filter.op.NotEqualTo, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.NotEqualTo.prototype.getEvalExpression = function(varName, literal) {
  if (literal != null) {
    return varName + '!=' + os.ui.filter.string.quoteString(literal);
  }

  // null is not supported, so don't return an expression
  return '';
};
