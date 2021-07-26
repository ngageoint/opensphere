goog.module('os.im.mapping.PositionMapping');
goog.module.declareLegacyNamespace();

const Fields = goog.require('os.Fields');
const {PREFER_LAT_FIRST, PREFER_LON_FIRST} = goog.require('os.geo');
const LatLonMapping = goog.require('os.im.mapping.LatLonMapping');
const MGRSMapping = goog.require('os.im.mapping.MGRSMapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const BasePositionMapping = goog.require('os.im.mapping.location.BasePositionMapping');

const Feature = goog.requireType('ol.Feature');
const IMapping = goog.requireType('os.im.mapping.IMapping');


/**
 * @extends {BasePositionMapping<Feature>}
 */
class PositionMapping extends BasePositionMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.xmlType = PositionMapping.ID;

    /**
     * @inheritDoc
     */
    this.types = PositionMapping.TYPES;

    /**
     * @inheritDoc
     */
    this.type = 'Lat/Lon';
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    return [this.field, Fields.LAT, Fields.LON];
  }

  /**
   * @inheritDoc
   */
  autoDetect(features) {
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
          if (field.match(BasePositionMapping.POS_REGEX)) {
            for (var type in this.types) {
              if (this.types[type].testField(String(fields[field]))) {
                var mapping = new PositionMapping();
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
  }
}

/**
 * @type {string}
 * @override
 */
PositionMapping.ID = 'Position';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(PositionMapping.ID, PositionMapping);

/**
 * @type {Object<string, IMapping>}
 * @override
 */
PositionMapping.TYPES = {
  'Lat/Lon': new LatLonMapping(PREFER_LAT_FIRST),
  'Lon/Lat': new LatLonMapping(PREFER_LON_FIRST),
  'MGRS': new MGRSMapping()
};

exports = PositionMapping;
