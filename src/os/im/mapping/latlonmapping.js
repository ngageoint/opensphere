goog.module('os.im.mapping.LatLonMapping');
goog.module.declareLegacyNamespace();

const Point = goog.require('ol.geom.Point');
const {COORD_CLEANER} = goog.require('os.geo');
const {getItemField} = goog.require('os.im.mapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const BaseLatLonMapping = goog.require('os.im.mapping.location.BaseLatLonMapping');

const Feature = goog.requireType('ol.Feature');


/**
 * Mapping to translate a coordinate string to a point geometry.
 *
 * @extends {BaseLatLonMapping<Feature>}
 */
class LatLonMapping extends BaseLatLonMapping {
  /**
   * Constructor.
   * @param {number=} opt_order
   */
  constructor(opt_order) {
    super(opt_order);
  }

  /**
   * Maps a coordinate string to a geometry.
   *
   * @param {Feature} item The feature to modify
   * @throws {Error} If the location field cannot be parsed.
   * @override
   */
  execute(item) {
    if (this.field) {
      var fieldValue = getItemField(item, this.field) || '';

      // try to idiot proof the position string
      fieldValue = fieldValue.replace(COORD_CLEANER, '').trim();
      if (fieldValue) {
        var location = this.parseLatLon(fieldValue, this.customFormat);
        if (location) {
          var coord = [location.lon, location.lat];
          var geom = new Point(coord).osTransform();

          item.suppressEvents();
          item.setGeometry(geom);
          item.enableEvents();
        } else {
          throw new Error('Could not parse coordinate from "' + fieldValue + '"!');
        }
      }
    }
  }
}

/**
 * @type {string}
 */
LatLonMapping.ID = 'LatLon';

// Register the mapping.
MappingRegistry.getInstance().registerMapping(LatLonMapping.ID, LatLonMapping);

exports = LatLonMapping;
