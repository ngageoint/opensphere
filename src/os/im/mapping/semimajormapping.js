goog.declareModuleId('os.im.mapping.SemiMajorMapping');

import Fields from '../../fields/fields.js';
import * as fields from '../../fields/index.js';
import MappingRegistry from './mappingregistry.js';
import RadiusMapping from './radiusmapping.js';


/**
 * Ellipse semi-major mapping.
 */
export default class SemiMajorMapping extends RadiusMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = fields.DEFAULT_SEMI_MAJ_COL_NAME;
    this.unitsField = Fields.SEMI_MAJOR_UNITS;
    this.unitsRegex = SemiMajorMapping.UNITS_REGEX;
    this.regex = SemiMajorMapping.REGEX;
    this.xmlType = SemiMajorMapping.ID;
  }

  /**
   * Regular expression to detect the semi-major field.
   * @type {RegExp}
   * @override
   */
  static get REGEX() {
    return /s(e(m(i)?)?)?[\W_]*maj(o(r)?)?/i;
  }

  /**
   * Regular expression to detect the semi-major units field.
   * @type {RegExp}
   * @override
   */
  static get UNITS_REGEX() {
    return /s(e(m(i)?)?)?[\W_]*maj(o(r)?)?_units/i;
  }
}


/**
 * @type {string}
 * @override
 */
SemiMajorMapping.ID = 'SemiMajor';


// Register the mapping.
MappingRegistry.getInstance().registerMapping(SemiMajorMapping.ID, SemiMajorMapping);
