goog.module('os.ui.filter.op.NotLike');
goog.module.declareLegacyNamespace();

const IsLike = goog.require('os.ui.filter.op.IsLike');
const Not = goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'PropertyIsLike' operation class.
 */
class NotLike extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new IsLike());
  }
}

exports = NotLike;
