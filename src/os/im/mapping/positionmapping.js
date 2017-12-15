goog.provide('os.im.mapping.PositionMapping');
goog.require('os.Fields');
goog.require('os.geo');
goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.LatLonMapping');
goog.require('os.im.mapping.MGRSMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.location.BasePositionMapping');



/**
 * @extends {os.im.mapping.location.BasePositionMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.PositionMapping = function() {
  os.im.mapping.PositionMapping.base(this, 'constructor');
  this.xmlType = os.im.mapping.PositionMapping.ID;

  /**
   * @inheritDoc
   */
  this.types = os.im.mapping.PositionMapping.TYPES;

  /**
   * @inheritDoc
   */
  this.type = 'Lat/Lon';
};
goog.inherits(os.im.mapping.PositionMapping, os.im.mapping.location.BasePositionMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.PositionMapping.ID = 'Position';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.PositionMapping.ID, os.im.mapping.PositionMapping);


/**
 * @type {Object.<string, os.im.mapping.IMapping>}
 * @const
 */
os.im.mapping.PositionMapping.TYPES = {
  'Lat/Lon': new os.im.mapping.LatLonMapping(os.geo.PREFER_LAT_FIRST),
  'Lon/Lat': new os.im.mapping.LatLonMapping(os.geo.PREFER_LON_FIRST),
  'MGRS': new os.im.mapping.MGRSMapping()
};


/**
 * @inheritDoc
 */
os.im.mapping.PositionMapping.prototype.getFieldsChanged = function() {
  return [this.field, os.Fields.LAT, os.Fields.LON];
};


/**
 * @inheritDoc
 */
os.im.mapping.PositionMapping.prototype.autoDetect = function(features) {
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
      for (var field in fields) {
        if (field.match(os.im.mapping.location.BasePositionMapping.POS_REGEX)) {
          for (var type in this.types) {
            if (this.types[type].testField(String(fields[field]))) {
              var mapping = new os.im.mapping.PositionMapping();
              mapping.field = field;
              mapping.setType(type);
              return mapping;
            }
          }
        }
      }
    }
  }

  return null;
};
