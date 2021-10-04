goog.declareModuleId('os.ogc.filter.OGCExclusionFormatter');

import OGCSpatialFormatter from './ogcspatialformatter.js';


/**
 * Formats a exclusion query for use in an OGC Filter.
 */
export default class OGCExclusionFormatter extends OGCSpatialFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column
   */
  constructor(opt_column) {
    super(opt_column);
  }

  /**
   * @inheritDoc
   */
  wrapMultiple(value) {
    return '<And>' + value + '</And>';
  }

  /**
   * @inheritDoc
   */
  format(feature) {
    var result = super.format(feature);
    result = result.replace(/(BBOX|Intersects)/g, 'Disjoint');
    return result;
  }
}
