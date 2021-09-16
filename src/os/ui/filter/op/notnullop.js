goog.module('os.ui.filter.op.NotNull');

const IsNull = goog.require('os.ui.filter.op.IsNull');
const Not = goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'PropertyIsNull' operation class.
 */
class NotNull extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new IsNull());
  }
}

exports = NotNull;
