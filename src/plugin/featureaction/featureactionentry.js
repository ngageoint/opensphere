goog.declareModuleId('plugin.im.action.feature.Entry');

import {filterFnGetter} from '../../os/feature/feature.js';
import FilterActionEntry from '../../os/im/action/filteractionentry.js';

/**
 * Filter entry that performs actions on matched features.
 *
 * @extends {FilterActionEntry<Feature>}
 */
export default class Entry extends FilterActionEntry {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setTitle('New Feature Action');
    this.filterGetter = filterFnGetter;
  }
}
