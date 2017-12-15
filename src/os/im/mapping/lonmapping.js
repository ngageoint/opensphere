goog.provide('os.im.mapping.LonMapping');
goog.require('os.Fields');
goog.require('os.im.mapping');
goog.require('os.im.mapping.LatMapping');
goog.require('os.im.mapping.MappingRegistry');



/**
 * @extends {os.im.mapping.LatMapping}
 * @constructor
 */
os.im.mapping.LonMapping = function() {
  os.im.mapping.LonMapping.base(this, 'constructor');
  this.coordField = os.Fields.LON;
  this.type = os.im.mapping.LonMapping.ID;
  this.regex = os.im.mapping.LonMapping.LON_REGEX;
  this.xmlType = os.im.mapping.LonMapping.ID;
};
goog.inherits(os.im.mapping.LonMapping, os.im.mapping.LatMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.LonMapping.ID = 'Longitude';

// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.LonMapping.ID, os.im.mapping.LonMapping);


/**
 * Matches "lon" with optional variations of "gitude", surrounded by a word boundary or undersos.
 * @type {RegExp}
 * @const
 */
os.im.mapping.LonMapping.LON_REGEX = /(\b|_)lon(g(i(t(u(d(e)?)?)?)?)?)?(\b|_)/i;


/**
 * @inheritDoc
 */
os.im.mapping.LonMapping.prototype.execute = function(item) {
  var value = NaN;
  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    if (fieldValue != null) {
      fieldValue = String(fieldValue).replace(os.geo.COORD_CLEANER, '');
      value = os.geo.parseLon(fieldValue, this.customFormat);

      if (!isNaN(value)) {
        os.im.mapping.setItemField(item, this.coordField, value);
        this.addGeometry(item);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.LonMapping.prototype.testField = function(value) {
  if (value) {
    var l = os.geo.parseLon(String(value));
    return goog.isDefAndNotNull(l) && !isNaN(l);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.LonMapping.prototype.testAndGetField = function(value, opt_format) {
  if (value) {
    var l = os.geo.parseLon(String(value), opt_format);
    if (goog.isDefAndNotNull(l) && !isNaN(l)) {
      return l.toString();
    }
  }
  return null;
};
