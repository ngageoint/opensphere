goog.provide('os.query.utils');

goog.require('goog.math');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.map');
goog.require('os.proj');


/**
 * Checks if an existing geometry is of type "world query"
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry to verify.
 * @return {boolean} true the query matches os.query.WORLD_GEOM
 */
os.query.utils.isWorldQuery = function(geometry) {
  var world = os.query.utils.WORLD_GEOM;
  if (world && geometry && geometry instanceof ol.geom.Polygon) {
    // transform the world extent to the current projection to compute the area
    var worldExtent = ol.proj.transformExtent(os.query.utils.WORLD_EXTENT, os.proj.EPSG4326, os.map.PROJECTION);
    var worldArea = ol.extent.getArea(worldExtent);
    if (goog.math.nearlyEquals(geometry.getArea(), worldArea) || geometry.getArea() == 0) {
      geometry.setCoordinates(world.getCoordinates());
      return true;
    }
  }

  return false;
};


/**
 * The world extent in EPSG:4326. This is the max precision that a polygon can handle.
 * @type {ol.Extent}
 * @const
 */
os.query.utils.WORLD_EXTENT = [-179.9999999999999, -89.99999999999999, 180, 90];


/**
 * Polygon representing the whole world.
 * @type {ol.geom.Polygon}
 */
os.query.utils.WORLD_GEOM = ol.geom.Polygon.fromExtent(os.query.utils.WORLD_EXTENT);


/**
 * Feature representing the whole world.
 * @type {ol.Feature}
 */
os.query.utils.WORLD_AREA = new ol.Feature({
  'geometry': os.query.utils.WORLD_GEOM,
  'title': 'Whole World'
});
