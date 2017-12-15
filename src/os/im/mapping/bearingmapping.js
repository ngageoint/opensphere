goog.provide('os.im.mapping.BearingMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RadiusMapping');



/**
 * Bearing mapping.
 * @extends {os.im.mapping.RadiusMapping}
 * @constructor
 */
os.im.mapping.BearingMapping = function() {
  os.im.mapping.BearingMapping.base(this, 'constructor');
  this.toField = os.Fields.BEARING;
  this.regex = os.im.mapping.BearingMapping.REGEX;
  this.units = null;
  this.unitsField = null;
  this.unitsRegex = null;
  this.xmlType = os.im.mapping.BearingMapping.ID;
};
goog.inherits(os.im.mapping.BearingMapping, os.im.mapping.RadiusMapping);


/**
 * @type {!RegExp}
 * @const
 */
os.im.mapping.BearingMapping.REGEX = /(bear(i(n(g)?)?)?)|(cour(s(e)?)|head(i(n(g)?)?)?)\b/i;


/**
 * @type {string}
 * @const
 */
os.im.mapping.BearingMapping.ID = 'Bearing';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.BearingMapping.ID, os.im.mapping.BearingMapping);
