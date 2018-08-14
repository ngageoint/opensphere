goog.provide('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RadiusMapping');



/**
 * Ellipse semi-minor mapping.
 * @extends {os.im.mapping.RadiusMapping}
 * @constructor
 */
os.im.mapping.SemiMinorMapping = function() {
  os.im.mapping.SemiMinorMapping.base(this, 'constructor');
  this.toField = os.fields.DEFAULT_SEMI_MIN_COL_NAME;
  this.unitsField = os.Fields.SEMI_MINOR_UNITS;
  this.unitsRegex = os.im.mapping.SemiMinorMapping.UNITS_REGEX;
  this.regex = os.im.mapping.SemiMinorMapping.REGEX;
  this.xmlType = os.im.mapping.SemiMinorMapping.ID;
};
goog.inherits(os.im.mapping.SemiMinorMapping, os.im.mapping.RadiusMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.SemiMinorMapping.ID = 'SemiMinor';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.SemiMinorMapping.ID, os.im.mapping.SemiMinorMapping);


/**
 * Regular expression to detect the semi-minor field.
 * @type {RegExp}
 * @const
 */
os.im.mapping.SemiMinorMapping.REGEX = /s(e(m(i)?)?)?[\W_]*min(o(r)?)?/i;


/**
 * Regular expression to detect the semi-minor units field.
 * @type {RegExp}
 * @const
 */
os.im.mapping.SemiMinorMapping.UNITS_REGEX = /s(e(m(i)?)?)?[\W_]*min(o(r)?)?_units/i;
