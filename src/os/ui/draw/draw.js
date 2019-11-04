goog.provide('os.ui.draw');

goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.geo.jsts.OLParser');
goog.require('os.style.area');


/**
 * The menu to display when drawing interaction completes.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.draw.MENU = undefined;


/**
 * Build a list of features to represent the search grid that intersects with the drawn geometry
 *
 * @param {ol.Feature} feature The source feature to trace.
 * @param {osx.ui.draw.GridOptions} options Config object for grid generation
 * @return {Array.<ol.Feature>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ui.draw.getGridFromFeature = function(feature, options) {
  var valid = function(options) {
    var b = (typeof options != 'undefined' && options != null);
    if (b) b = (typeof options.detail == 'number' && options.detail > 0.0); // enforce numeric, positive, non-null, non-zero;
    if (b) b = (typeof options.max == 'number' && options.max > 0.0); // enforce numeric, positive, non-null, non-zero;
    if (b) b = (typeof options.style == 'object');
    return b; // any failure skips next tests
  };

  if (!feature || !options || !valid(options)) return null;

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

  var prop = {};
  goog.object.extend(prop, feature.values_);
  delete prop['geometry'];
  delete prop['title'];
  delete prop['_node'];

  // TODO research a better, faster way to create/approximate the grid
  // build detail x detail degree boxes that fit the "snapped" extent
  for (var lon = cfg.lon.n; lon < cfg.lon.x; lon += detail) {
    for (var lat = cfg.lat.n; lat < cfg.lat.x; lat += detail) {
      var gridExtent = ol.proj.transformExtent(
          [lon, lat, lon + detail, lat + detail],
          os.proj.EPSG4326,
          os.map.PROJECTION);

      // only add this to the grid if the original polygon intersects it
      if (feature.getGeometry().intersectsExtent(gridExtent)) {
        features.push(os.ui.draw.gridFeatureFromExtent_(gridExtent, prop, options));
      }
    }
  }

  // TODO build a trace of the grid and save that to the Drawing Layers

  return features;
};


/**
 * Helper function; gets a numeric representation of the JSON setting
 *
 * @param {string} key
 * @param {number} defaultValue
 * @return {number}
 */
os.ui.draw.getGridSetting = function(key, defaultValue) {
  var value = defaultValue;
  try {
    value = parseFloat(os.settings.get(key, defaultValue));
  } catch (e) {
    // do nothing
  }
  return value;
};


/**
 * Build a grid feature from the extent and GridOptions
 *
 * @param {Array.<number>} extent The outer bounds of this grid
 * @param {Object} prop The drawing and altitude modes; copied from the context feature
 * @param {osx.ui.draw.GridOptions} options The color, line thickness, etc settings for this grid
 * @return {ol.Feature}
 * @private
 */
os.ui.draw.gridFeatureFromExtent_ = function(extent, prop, options) {
  // new() is faster than doing os.feature.copyFeature(feature) from the original feature
  var g = ol.geom.Polygon.fromExtent(extent);
  var prop_ = {'geometry': g};
  goog.object.extend(prop_, prop);

  var f = new ol.Feature(prop_);
  f.setId(goog.string.getRandomString());
  f.setStyle(options.style);
  f.set(os.data.RecordField.DRAWING_LAYER_NODE, false);
  f.set(os.data.RecordField.INTERACTIVE, false);

  return f;
};
