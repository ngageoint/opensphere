goog.provide('os.ui.filter.op.NotBetween');

goog.require('os.ui.filter.op.Between');
goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'between' operation class.
 * @extends {os.ui.filter.op.Not}
 * @constructor
 */
os.ui.filter.op.NotBetween = function() {
  os.ui.filter.op.NotBetween.base(this, 'constructor',
      new os.ui.filter.op.Between());
};
goog.inherits(os.ui.filter.op.NotBetween, os.ui.filter.op.Not);
