goog.module('os.query.utils');
goog.module.declareLegacyNamespace();

const {nearlyEquals} = goog.require('goog.math');
const Feature = goog.require('ol.Feature');
const {getArea} = goog.require('ol.extent');
const GeometryType = goog.require('ol.geom.GeometryType');
const Polygon = goog.require('ol.geom.Polygon');
const {transformExtent} = goog.require('ol.proj');
const osMap = goog.require('os.map');
const {EPSG4326} = goog.require('os.proj');


/**
 * The world extent in EPSG:4326. This is the max precision that a polygon can handle.
 * @type {Array<number>}
 * @const
 */
const WORLD_EXTENT = [-179.9999999999999, -89.99999999999999, 180, 90];


/**
 * The world coordinates in EPSG:4326. This is the max precision that a polygon can handle.
 * Note: this includes coordinates at 0 latitude to ensure directionality of the vertical line components in 3D.
 * @type {Array<Array<Array<number>>>}
 * @const
 */
const WORLD_COORDS = [[
  [-179.9999999999999, -89.99999999999999],
  [-179.9999999999999, 0],
  [-179.9999999999999, 90],
  [180, 90],
  [180, 0],
  [180, -89.99999999999999],
  [-179.9999999999999, -89.99999999999999]
]];


/**
 * Polygon representing the whole world.
 * @type {ol.geom.Polygon}
 */
const WORLD_GEOM = new Polygon(WORLD_COORDS);


/**
 * @type {number|undefined}
 * @private
 */
let worldArea_ = undefined;


/**
 * Checks if an existing geometry is of type "world query"
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry to verify.
 * @return {boolean} true the query matches WORLD_GEOM
 */
exports.isWorldQuery = function(geometry) {
  if (worldArea_ == null) {
    exports.initWorldArea();
  }

  if (worldArea_ && geometry && geometry.getType() === GeometryType.POLYGON) {
    // transform the world extent to the current projection to compute the area
    var geomArea = /** @type {ol.geom.Polygon} */ (geometry).getArea();
    return nearlyEquals(geomArea / worldArea_, 1, 1E-4) || geomArea == 0;
  }

  return false;
};


/**
 * calculates world area
 *
 * @param {boolean=} opt_reset
 */
exports.initWorldArea = function(opt_reset) {
  if (opt_reset) {
    worldArea_ = undefined;
  } else {
    var worldExtent = transformExtent(WORLD_EXTENT, EPSG4326, osMap.PROJECTION);
    worldArea_ = getArea(worldExtent);
  }
};


/**
 * Feature representing the whole world.
 * @type {Feature}
 */
exports.WORLD_AREA = new Feature({
  'geometry': WORLD_GEOM,
  'title': 'Whole World'
});


/**
 * Feature representing the area we want to zoom to when zooming to the whole world.
 * @type {Feature}
 */
exports.WORLD_ZOOM_FEATURE = new Feature(new Polygon([[
  [179, 90],
  [181, 90],
  [181, -90],
  [179, -90],
  [179, 90]
]]));


exports.WORLD_EXTENT = WORLD_EXTENT;
exports.WORLD_COORDS = WORLD_COORDS;
exports.WORLD_GEOM = WORLD_GEOM;
