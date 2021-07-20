goog.module('os.im.mapping.SemiMinorMapping');
goog.module.declareLegacyNamespace();

const Fields = goog.require('os.Fields');
const fields = goog.require('os.fields');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');


/**
 * Ellipse semi-minor mapping.
 */
class SemiMinorMapping extends RadiusMapping {
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


exports = SemiMinorMapping;
