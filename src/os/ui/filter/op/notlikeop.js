goog.declareModuleId('os.ui.filter.op.NotLike');

import IsLike from './islikeop.js';
import Not from './notop.js';


/**
 * An inverse 'PropertyIsLike' operation class.
 */
export default class NotLike extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new IsLike());
  }
}
