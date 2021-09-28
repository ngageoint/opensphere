goog.declareModuleId('os.im.mapping.BearingMapping');

import Fields from '../../fields/fields.js';
import MappingRegistry from './mappingregistry.js';
import RadiusMapping from './radiusmapping.js';


/**
 * Bearing mapping.
 */
export default class BearingMapping extends RadiusMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = Fields.BEARING;
    this.regex = BearingMapping.REGEX;
    this.units = null;
    this.unitsField = null;
    this.unitsRegex = null;
    this.xmlType = BearingMapping.ID;
  }

  /**
   * @type {!RegExp}
   * @override
   */
  static get REGEX() {
    return /(bear(i(n(g)?)?)?)|(cour(s(e)?)|head(i(n(g)?)?)?)\b/i;
  }
}


/**
 * @type {string}
 * @override
 */
BearingMapping.ID = 'Bearing';


// Register the mapping.
MappingRegistry.getInstance().registerMapping(BearingMapping.ID, BearingMapping);
