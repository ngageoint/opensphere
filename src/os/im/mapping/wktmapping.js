goog.provide('os.im.mapping.WKTMapping');
goog.require('ol.format.WKT');
goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractPositionMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.ol.wkt');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.WKTMapping = function() {
  os.im.mapping.WKTMapping.base(this, 'constructor');
  this.xmlType = os.im.mapping.WKTMapping.ID;
};
goog.inherits(os.im.mapping.WKTMapping, os.im.mapping.AbstractPositionMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.WKTMapping.ID = 'WKTGeometry';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.WKTMapping.ID, os.im.mapping.WKTMapping);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.mapping.WKTMapping.LOGGER_ = goog.log.getLogger('os.im.mapping.WKTMapping');


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.WKTMapping.WKT_REGEX =
    /^\s*(POINT|LINESTRING|LINEARRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)\s*Z?[(]/i;

/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.WKTMapping.CENTER_REGEXP = /(center|centroid)/i;


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.getId = function() {
  return os.im.mapping.WKTMapping.ID;
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.getFieldsChanged = function() {
  return [this.field];
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.getLabel = function() {
  return os.im.mapping.WKTMapping.ID;
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.getScore = function() {
  return 20;
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.getScoreType = function() {
  return 'geom';
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.execute = function(item) {
  if (this.field) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    if (fieldValue) {
      var geom = os.ol.wkt.FORMAT.readGeometry(String(fieldValue), {
        dataProjection: os.proj.EPSG4326,
        featureProjection: os.map.PROJECTION
      });

      if (geom) {
        item.suppressEvents();
        item.set(this.field, undefined);
        item.setGeometry(geom);
        item.enableEvents();
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.autoDetect = function(features) {
  if (features) {
    var i = features.length;
    while (i--) {
      var feature = features[i];
      var geom = feature.getGeometry();
      if (geom) {
        // Something else (most likely the parser) has already populated the geometry.
        return null;
      }

      var fields = feature.getProperties();
      var mappings = [];

      for (var field in fields) {
        var val = feature.get(field);
        if (val && os.im.mapping.WKTMapping.WKT_REGEX.test(String(val))) {
          var mapping = new os.im.mapping.WKTMapping();
          mapping.field = field;
          mappings.push(mapping);
        }
      }

      // if multiple WKT fields, favor anything over CENTROID/CENTER, which is likely center of the actual geometry
      if (mappings.length > 0) {
        var map = mappings[0];
        for (var j = 0; j < mappings.length; j++) {
          if (!os.im.mapping.WKTMapping.CENTER_REGEXP.test(mappings[j].field)) {
            map = mappings[j];
          }
        }
        return map;
      }
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.im.mapping.WKTMapping.prototype.testField = function(value) {
  var geom = null;
  try { // ol throws all kinds off errors when the format is unexpected
    geom = os.ol.wkt.FORMAT.readGeometry(String(value));
  } catch (e) {
    goog.log.error(os.im.mapping.WKTMapping.LOGGER_, 'failed restoring descriptors from settings', e);
  }
  return goog.isDefAndNotNull(geom);
};
