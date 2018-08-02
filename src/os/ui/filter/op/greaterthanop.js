goog.provide('os.ui.filter.op.GreaterThan');

goog.require('goog.string');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsGreaterThan' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.GreaterThan = function() {
  os.ui.filter.op.GreaterThan.base(this, 'constructor',
      'PropertyIsGreaterThan', 'is greater than', '>');
};
goog.inherits(os.ui.filter.op.GreaterThan, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.GreaterThan.prototype.getEvalExpression = function(varName, literal) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(literal))) {
    return varName + '>' + os.ui.filter.string.quoteString(literal);
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};
