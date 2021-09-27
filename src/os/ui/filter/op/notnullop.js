goog.declareModuleId('os.ui.filter.op.NotNull');

import IsNull from './isnullop.js';
import Not from './notop.js';


/**
 * An inverse 'PropertyIsNull' operation class.
 */
export default class NotNull extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new IsNull());
  }
}
