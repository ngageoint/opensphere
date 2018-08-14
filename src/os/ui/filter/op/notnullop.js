goog.provide('os.ui.filter.op.NotNull');

goog.require('os.ui.filter.op.IsNull');
goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'PropertyIsNull' operation class.
 * @extends {os.ui.filter.op.Not}
 * @constructor
 */
os.ui.filter.op.NotNull = function() {
  os.ui.filter.op.NotNull.base(this, 'constructor',
      new os.ui.filter.op.IsNull());
};
goog.inherits(os.ui.filter.op.NotNull, os.ui.filter.op.Not);
