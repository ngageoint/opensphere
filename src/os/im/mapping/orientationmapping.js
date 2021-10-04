goog.declareModuleId('os.im.mapping.OrientationMapping');

import Fields from '../../fields/fields.js';
import MappingRegistry from './mappingregistry.js';
import RadiusMapping from './radiusmapping.js';


/**
 * Ellipse orientation mapping.
 */
export default class OrientationMapping extends RadiusMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = Fields.ORIENTATION;
    this.regex = OrientationMapping.REGEX;
    this.units = null;
    this.unitsField = null;
    this.unitsRegex = null;
    this.xmlType = OrientationMapping.ID;
  }

  /**
   * @type {RegExp}
   * @override
   */
  static get REGEX() {
    return /(tilt|strike|orient(a(t(i(o(n)?)?)?)?)?)/i;
  }
}


/**
 * @type {string}
 * @override
 */
OrientationMapping.ID = 'Orientation';


// Register the mapping.
MappingRegistry.getInstance().registerMapping(OrientationMapping.ID, OrientationMapping);
