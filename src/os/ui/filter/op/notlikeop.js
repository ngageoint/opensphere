goog.provide('os.ui.filter.op.NotLike');

goog.require('os.ui.filter.op.IsLike');
goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'PropertyIsLike' operation class.
 * @extends {os.ui.filter.op.Not}
 * @constructor
 */
os.ui.filter.op.NotLike = function() {
  os.ui.filter.op.NotLike.base(this, 'constructor',
      new os.ui.filter.op.IsLike());
};
goog.inherits(os.ui.filter.op.NotLike, os.ui.filter.op.Not);
