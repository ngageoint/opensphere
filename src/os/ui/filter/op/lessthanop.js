goog.provide('os.ui.filter.op.LessThan');

goog.require('goog.string');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');


/**
 * A 'PropertyIsLessThan' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.LessThan = function() {
  os.ui.filter.op.LessThan.base(this, 'constructor',
      'PropertyIsLessThan', 'is less than', '<');
};
goog.inherits(os.ui.filter.op.LessThan, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.LessThan.prototype.getEvalExpression = function(varName, literal) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(literal))) {
    return varName + '<' + os.ui.filter.string.quoteString(literal);
  }

  // null/empty string is not supported, so don't return an expression
  return '';
};
