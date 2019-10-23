goog.provide('os.ui.draw');
goog.provide('os.ui.draw.utils');

goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.geo.jsts.OLParser');

/**
 * The menu to display when drawing interaction completes.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.draw.MENU = undefined;
os.ui.draw.GRID_DETAIL = 'search.grid.detail';
os.ui.draw.GRID_DETAIL_MAX = 'search.grid.detailMax';


/**
 * Build a list of features to represent the search grid that intersects with the drawn geometry
 *
 * @param {ol.Feature} feature The source feature to trace.
 * @param {number} detail The number of degrees to which to "snap" the grid
 * @return {Array.<ol.Feature>}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ui.draw.utils.getGridFromFeature = function(feature, detail) {
  if (!feature) return null;

  var features = [];
  var geo = feature.getGeometry();

  geo.toLonLat(); // convert to lon/lat so grid 'detail' (in degrees) can be applied easily
  var extent = geo.getExtent(); // build a simplified box around the search geometry
  geo.osTransform(); // undo transformation so copyFeature() succeeds

  // the number of boxes (X * Y) at which to skip this grid feature; from settings.json
  var mult = os.ui.draw.utils.getGridSetting(os.ui.draw.GRID_DETAIL_MAX, 100.0);

  // don't continue building the grid if it would create too many boxes
  if ((Math.ceil(Math.abs(extent[2] - extent[0]) / detail) *
      Math.ceil(Math.abs(extent[3] - extent[1]) / detail)) > mult) return null;

  // snap box coordinates to the nearest "detail" degrees
  var snap = function(l, d, ceil) {
    if ((l % d) != 0.0) return Math.floor(l / d) * d + (ceil ? d : 0.0);
    return l;
  };

  extent[0] = snap(extent[0], detail, false); // lon min
  extent[1] = snap(extent[1], detail, false); // lat min
  extent[2] = snap(extent[2], detail, true); // lon max
  extent[3] = snap(extent[3], detail, true); // lat max

  var style = os.style.area.SEARCH_GRID_STYLE;
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
        // new() is faster than doing os.feature.copyFeature(feature)
        var g = ol.geom.Polygon.fromExtent(gridExtent);
        var prop_ = {'geometry': g};
        goog.object.extend(prop_, prop);

        var f = new ol.Feature(prop_);
        f.setId(goog.string.getRandomString());
        f.setStyle(style);
        f.set(os.data.RecordField.DRAWING_LAYER_NODE, true);
        f.set(os.data.RecordField.INTERACTIVE, false);

        features.push(f);
      }
    }
  }

  // TODO build a union-ed multipolygon of this 'grid'

  return features;
};


/**
 * Helper function; gets a numeric representation of the JSON setting
 *
 * @param {string} key
 * @param {number} defaultValue
 * @return {number}
 */
os.ui.draw.utils.getGridSetting = function(key, defaultValue) {
  var value = defaultValue;
  try {
    value = parseFloat(os.settings.get(key, defaultValue));
  } catch (e) {
    // do nothing
  }
  return value;
};
