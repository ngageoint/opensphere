goog.provide('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RadiusMapping');



/**
 * Ellipse semi-major mapping.
 * @extends {os.im.mapping.RadiusMapping}
 * @constructor
 */
os.im.mapping.SemiMajorMapping = function() {
  os.im.mapping.SemiMajorMapping.base(this, 'constructor');
  this.toField = os.fields.DEFAULT_SEMI_MAJ_COL_NAME;
  this.unitsField = os.Fields.SEMI_MAJOR_UNITS;
  this.unitsRegex = os.im.mapping.SemiMajorMapping.UNITS_REGEX;
  this.regex = os.im.mapping.SemiMajorMapping.REGEX;
  this.xmlType = os.im.mapping.SemiMajorMapping.ID;
};
goog.inherits(os.im.mapping.SemiMajorMapping, os.im.mapping.RadiusMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.SemiMajorMapping.ID = 'SemiMajor';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.SemiMajorMapping.ID, os.im.mapping.SemiMajorMapping);


/**
 * Regular expression to detect the semi-major field.
 * @type {RegExp}
 * @const
 */
os.im.mapping.SemiMajorMapping.REGEX = /s(e(m(i)?)?)?[\W_]*maj(o(r)?)?/i;


/**
 * Regular expression to detect the semi-major units field.
 * @type {RegExp}
 * @const
 */
os.im.mapping.SemiMajorMapping.UNITS_REGEX = /s(e(m(i)?)?)?[\W_]*maj(o(r)?)?_units/i;
