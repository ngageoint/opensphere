goog.declareModuleId('os.ui.filter.op.NotBetween');

import Between from './betweenop.js';
import Not from './notop.js';


/**
 * An inverse 'between' operation class.
 */
export default class NotBetween extends Not {
  /**
   * Constructor.
   */
  constructor() {
    super(new Between());
  }
}
