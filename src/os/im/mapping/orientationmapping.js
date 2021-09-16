goog.module('os.im.mapping.OrientationMapping');

const Fields = goog.require('os.Fields');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');


/**
 * Ellipse orientation mapping.
 */
class OrientationMapping extends RadiusMapping {
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


exports = OrientationMapping;
