goog.declareModuleId('os.im.mapping.SemiMinorMapping');

import Fields from '../../fields/fields.js';
import * as fields from '../../fields/index.js';
import MappingRegistry from './mappingregistry.js';
import RadiusMapping from './radiusmapping.js';


/**
 * Ellipse semi-minor mapping.
 */
export default class SemiMinorMapping extends RadiusMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = fields.DEFAULT_SEMI_MIN_COL_NAME;
    this.unitsField = Fields.SEMI_MINOR_UNITS;
    this.unitsRegex = SemiMinorMapping.UNITS_REGEX;
    this.regex = SemiMinorMapping.REGEX;
    this.xmlType = SemiMinorMapping.ID;
  }

  /**
   * Regular expression to detect the semi-minor field.
   * @type {RegExp}
   * @override
   */
  static get REGEX() {
    return /s(e(m(i)?)?)?[\W_]*min(o(r)?)?/i;
  }

  /**
   * Regular expression to detect the semi-minor units field.
   * @type {RegExp}
   * @override
   */
  static get UNITS_REGEX() {
    return /s(e(m(i)?)?)?[\W_]*min(o(r)?)?_units/i;
  }
}


/**
 * @type {string}
 * @override
 */
SemiMinorMapping.ID = 'SemiMinor';


// Register the mapping.
MappingRegistry.getInstance().registerMapping(SemiMinorMapping.ID, SemiMinorMapping);
