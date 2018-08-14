goog.provide('os.ui.filter.op.IsNull');

goog.require('os.ui.filter.op.Op');


/**
 * A 'PropertyIsNull' operation class.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.IsNull = function() {
  os.ui.filter.op.IsNull.base(this, 'constructor',
      'PropertyIsNull', 'is empty', 'empty', undefined, undefined, undefined, 'span', true);
};
goog.inherits(os.ui.filter.op.IsNull, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.IsNull.prototype.getEvalExpression = function(varName, literal) {
  return '(' + varName + '==null||' + varName + '==="")';
};
