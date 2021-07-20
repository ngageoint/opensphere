goog.module('os.im.mapping.SemiMajorMapping');
goog.module.declareLegacyNamespace();

const Fields = goog.require('os.Fields');
const fields = goog.require('os.fields');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');


/**
 * Ellipse semi-major mapping.
 */
class SemiMajorMapping extends RadiusMapping {
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


exports = SemiMajorMapping;
