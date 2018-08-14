goog.provide('os.im.mapping.LatMapping');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.geo');
goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractPositionMapping');
goog.require('os.im.mapping.MappingRegistry');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.LatMapping = function() {
  os.im.mapping.LatMapping.base(this, 'constructor');
  this.xmlType = os.im.mapping.LatMapping.ID;

  /**
   * @type {string}
   * @protected
   */
  this.coordField = os.Fields.LAT;

  /**
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.LatMapping.ID;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = os.im.mapping.LatMapping.LAT_REGEX;
};
goog.inherits(os.im.mapping.LatMapping, os.im.mapping.AbstractPositionMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.LatMapping.ID = 'Latitude';

// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.LatMapping.ID, os.im.mapping.LatMapping);


/**
 * Matches "lat" with optional variations of "itude", surrounded by a word boundary, whitespace, or undersos.
 * @type {RegExp}
 * @const
 */
os.im.mapping.LatMapping.LAT_REGEX = /(\b|_)lat(i(t(u(d(e)?)?)?)?)?(\b|_)/i;


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.getId = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.getFieldsChanged = function() {
  return [this.field, this.coordField];
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.getScore = function() {
  if (this.type && this.field) {
    return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
  }

  return os.im.mapping.LatMapping.base(this, 'getScore');
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.getScoreType = function() {
  return 'geom';
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.execute = function(item) {
  var value = NaN;
  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    if (fieldValue != null) {
      fieldValue = String(fieldValue).replace(os.geo.COORD_CLEANER, '');
      value = os.geo.parseLat(fieldValue, this.customFormat);

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
os.im.mapping.LatMapping.prototype.testField = function(value) {
  if (value) {
    var l = os.geo.parseLat(String(value));
    return goog.isDefAndNotNull(l) && !isNaN(l);
  }
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.testAndGetField = function(value, opt_format) {
  if (value) {
    var l = os.geo.parseLat(String(value), opt_format);
    if (goog.isDefAndNotNull(l) && !isNaN(l)) {
      return l.toString();
    }
  }
  return null;
};


/**
 * @param {ol.Feature} feature
 * @protected
 */
os.im.mapping.LatMapping.prototype.addGeometry = function(feature) {
  var current = feature.getGeometry();
  if (current) {
    // already has a geometry... don't bother
    return;
  }

  var lat = feature.get(os.Fields.LAT);
  var lon = feature.get(os.Fields.LON);
  if (goog.isDef(lat) && !isNaN(lat) && goog.isNumber(lat) && goog.isDef(lon) && !isNaN(lon) && goog.isNumber(lon)) {
    var geom = new ol.geom.Point([lon, lat]);
    feature.suppressEvents();
    feature.setGeometry(geom.osTransform());
    feature.enableEvents();
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.LatMapping.prototype.autoDetect = function(items) {
  var m = null;
  if (items) {
    var i = items.length;
    var f = undefined;
    while (i--) {
      var feature = items[i];
      var geom = feature.getGeometry();
      if (geom) {
        // Something else (most likely the parser) has already populated the geometry.
        return null;
      }

      f = os.im.mapping.getBestFieldMatch(feature, this.regex, f);

      if (f) {
        m = new this.constructor();
        m.field = f;
      }
    }
  }

  return m;
};
