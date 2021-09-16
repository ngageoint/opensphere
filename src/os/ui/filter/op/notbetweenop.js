goog.module('os.ui.filter.op.NotBetween');

const Between = goog.require('os.ui.filter.op.Between');
const Not = goog.require('os.ui.filter.op.Not');


/**
 * An inverse 'between' operation class.
 */
class NotBetween extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new Between());
  }
}

exports = NotBetween;
