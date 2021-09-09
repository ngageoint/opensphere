goog.module('os.im.mapping.BearingMapping');

const Fields = goog.require('os.Fields');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');


/**
 * Bearing mapping.
 */
class BearingMapping extends RadiusMapping {
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


exports = BearingMapping;
