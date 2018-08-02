goog.provide('os.im.mapping.OrientationMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RadiusMapping');



/**
 * Ellipse orientation mapping.
 * @extends {os.im.mapping.RadiusMapping}
 * @constructor
 */
os.im.mapping.OrientationMapping = function() {
  os.im.mapping.OrientationMapping.base(this, 'constructor');
  this.toField = os.Fields.ORIENTATION;
  this.regex = os.im.mapping.OrientationMapping.REGEX;
  this.units = null;
  this.unitsField = null;
  this.unitsRegex = null;
  this.xmlType = os.im.mapping.OrientationMapping.ID;
};
goog.inherits(os.im.mapping.OrientationMapping, os.im.mapping.RadiusMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.OrientationMapping.ID = 'Orientation';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.OrientationMapping.ID, os.im.mapping.OrientationMapping);


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.OrientationMapping.REGEX = /(tilt|strike|orient(a(t(i(o(n)?)?)?)?)?)/i;
