goog.declareModuleId('os.ui.draw');

import Feature from 'ol/src/Feature.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {transformExtent} from 'ol/src/proj.js';

import RecordField from '../../data/recordfield.js';
import {METHOD_FIELD} from '../../interpolate.js';
import Method from '../../interpolatemethod.js';
import * as osMap from '../../map/map.js';

import {EPSG4326} from '../../proj/proj.js';
import AltitudeMode from '../../webgl/altitudemode.js';

const {getRandomString} = goog.require('goog.string');

const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * The menu to display when drawing interaction completes.
 * @type {Menu|undefined}
 */
let drawMenu = undefined;

/**
 * Get the draw menu.
 * @return {Menu|undefined}
 */
export const getMenu = () => drawMenu;

/**
 * Set the draw menu.
 * @param {Menu|undefined} value
 */
export const setMenu = (value) => {
  drawMenu = value;
};

/**
 * Build a list of features to represent the search grid that intersects with the drawn geometry
 *
 * @param {Feature} feature The source feature to trace.
 * @param {osx.ui.draw.GridOptions} options Config object for grid generation
 * @return {Array<Feature>}
 */
export const getGridFromFeature = function(feature, options) {
  if (!feature || !options || !gridOptionsValid(options)) return null;

  var detail = options.detail;
  var max = options.max;

  var features = [];
  var geo = feature.getGeometry();

  geo.toLonLat(); // convert to lon/lat so grid 'detail' (in degrees) can be applied easily
  var extent = geo.getExtent(); // build a simplified box around the search geometry
  geo.osTransform(); // undo transformation so copyFeature() succeeds

  // snap box coordinates to the nearest "detail" degrees
  var snap = function(l, d, ceil) {
    if ((l % d) != 0.0) return Math.floor(l / d) * d + (ceil ? d : 0.0);
    return l;
  };

  extent[0] = snap(extent[0], detail, false); // lon min
  extent[1] = snap(extent[1], detail, false); // lat min
  extent[2] = snap(extent[2], detail, true); // lon max
  extent[3] = snap(extent[3], detail, true); // lat max

  // don't continue building the grid if it would create too many boxes
  if ((Math.ceil(Math.abs(extent[2] - extent[0]) / detail) *
      Math.ceil(Math.abs(extent[3] - extent[1]) / detail)) > max) return null;

  var cfg = {
    lon: {
      n: (extent[0] < extent[2]) ? extent[0] : extent[2],
      x: (extent[0] < extent[2]) ? extent[2] : extent[0]
    },
    lat: {
      n: (extent[1] < extent[3]) ? extent[1] : extent[3],
      x: (extent[1] < extent[3]) ? extent[3] : extent[1]
    }
  }; // sort the data so the loops later are faster

  var prop = {}; // starting Feature properties; copied into each grid Feature
  prop[METHOD_FIELD] = Method.RHUMB; // these are lat/lon boxes; always draw them RHUMB
  prop[RecordField.ALTITUDE_MODE] = AltitudeMode.CLAMP_TO_GROUND; // follow terrain (if applicable)
  prop[RecordField.DRAWING_LAYER_NODE] = false; // part of the drawing layer, but not visible in Layers mgr
  prop[RecordField.INTERACTIVE] = false; // no hover, selection, etc

  // TODO research a better, faster way to create/approximate the grid
  // build detail x detail degree boxes that fit the "snapped" extent
  for (var lon = cfg.lon.n; lon < cfg.lon.x; lon += detail) {
    for (var lat = cfg.lat.n; lat < cfg.lat.x; lat += detail) {
      var gridExtent = transformExtent(
          [lon, lat, lon + detail, lat + detail],
          EPSG4326,
          osMap.PROJECTION);

      // only add this to the grid if the original polygon intersects it
      if (feature.getGeometry().intersectsExtent(gridExtent)) {
        features.push(gridFeatureFromExtent(gridExtent, prop, options));
      }
    }
  }

  // build a trace of the grid as a single geometry
  // var geometry = os.geo.jsts.merge(geometries);
  // var trace = new Feature(geometry);

  // TODO use a repeating square image background fill (with the proper scaling factor) to visually simulate a grid
  // var scalar = detail; // if the image is sized as 1 deg x 1 deg, then multiply by "detail" to get the new size

  return features;
};

/**
 * Helper function to make sure the grid options won't cause infinite loops, etc in the getGridFromFeature() call
 * @param {osx.ui.draw.GridOptions} options The color, line thickness, etc settings for this grid
 * @return {boolean}
 */
const gridOptionsValid = function(options) {
  return (options.detail > 0.0 && options.max > 0.0);
};

/**
 * Build a grid feature from the extent and GridOptions
 *
 * @param {Array<number>} extent The outer bounds of this grid
 * @param {Object} prop The interpolation method, altitude mode, etc; copied to all grid Features
 * @param {osx.ui.draw.GridOptions} options The color, line thickness, etc settings for this grid
 * @return {Feature}
 */
const gridFeatureFromExtent = function(extent, prop, options) {
  // new() is faster than doing os.feature.copyFeature(feature) from the original feature
  var g = fromExtent(extent);
  var p = Object.assign({}, prop); // make a copy

  var f = new Feature(p);
  f.setId(getRandomString());
  f.setGeometry(g);
  f.setStyle(options.style);

  return f;
};
