goog.provide('os.im.mapping.MGRSMapping');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.geo');
goog.require('os.im.mapping');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.location.BaseMGRSMapping');



/**
 * Mapping to translate an MGRS coordinate string to a point geometry.
 * @extends {os.im.mapping.location.BaseMGRSMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.MGRSMapping = function() {
  os.im.mapping.MGRSMapping.base(this, 'constructor');
};
goog.inherits(os.im.mapping.MGRSMapping, os.im.mapping.location.BaseMGRSMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.MGRSMapping.ID = 'MGRSMapping';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.MGRSMapping.ID, os.im.mapping.MGRSMapping);


/**
 * Maps an MGRS coordinate string to a geometry.
 * @param {ol.Feature} item The feature to modify
 * @throws {Error} If the location field cannot be parsed.
 * @override
 */
os.im.mapping.MGRSMapping.prototype.execute = function(item) {
  if (this.field) {
    var mgrs = os.im.mapping.getItemField(item, this.field);
    if (mgrs) {
      mgrs = mgrs.replace(/\s/g, '');
      mgrs = mgrs.toUpperCase();

      if (mgrs.match(os.geo.MGRS_REGEXP)) {
        var coord = osasm.toLonLat(mgrs);
        var geom = new ol.geom.Point(coord);
        item.suppressEvents();
        item.setGeometry(geom.osTransform());
        item.enableEvents();
      } else {
        throw new Error('"' + mgrs + '" does not appear to be a valid MGRS coordinate!');
      }
    }
  }
};
