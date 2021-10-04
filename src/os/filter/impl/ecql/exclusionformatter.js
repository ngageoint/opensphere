goog.declareModuleId('os.filter.impl.ecql.ExclusionFormatter');

import AreaFormatter from './areaformatter.js';


/**
 */
export default class ExclusionFormatter extends AreaFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column Optional geometry column name
   */
  constructor(opt_column) {
    super(opt_column);
    this.spatialPredicate = 'DISJOINT';
    this.group = 'AND';
  }
}
