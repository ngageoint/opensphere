goog.provide('os.im.mapping.LatLonMapping');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.im.mapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.location.BaseLatLonMapping');



/**
 * Mapping to translate a coordinate string to a point geometry.
 *
 * @param {number=} opt_order
 * @extends {os.im.mapping.location.BaseLatLonMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.LatLonMapping = function(opt_order) {
  os.im.mapping.LatLonMapping.base(this, 'constructor', opt_order);
};
goog.inherits(os.im.mapping.LatLonMapping, os.im.mapping.location.BaseLatLonMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.LatLonMapping.ID = 'LatLon';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.LatLonMapping.ID, os.im.mapping.LatLonMapping);


/**
 * Maps a coordinate string to a geometry.
 *
 * @param {ol.Feature} item The feature to modify
 * @throws {Error} If the location field cannot be parsed.
 * @override
 */
os.im.mapping.LatLonMapping.prototype.execute = function(item) {
  const result = false;
  if (this.field) {
    let fieldValue = os.im.mapping.getItemField(item, this.field) || '';
    // try to idiot proof the position string
    fieldValue = goog.string.trim(fieldValue.replace(os.geo.COORD_CLEANER, ''));

    if (fieldValue) {
      result = fieldValue !== undefined || fieldValue !== '' || fieldValue !== null;
      const location = this.parseLatLon(fieldValue, this.customFormat);
      if (location) {
        const coord = [location.lon, location.lat];
        const geom = new ol.geom.Point(coord).osTransform();

        item.suppressEvents();
        item.setGeometry(geom);
        item.enableEvents();
      } else {
        throw new Error('Could not parse coordinate from "' + fieldValue + '"!');
      }
    }
  }
  return result;
};
