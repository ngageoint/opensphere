goog.module('os.feature.measure');
goog.module.declareLegacyNamespace();

const LineString = goog.require('ol.geom.LineString');
const {modifyBearing, getFormattedBearing} = goog.require('os.bearing');
const {getLayer} = goog.require('os.feature');
const {ORIGINAL_GEOM_FIELD} = goog.require('os.interpolate');
const {getMapContainer} = goog.require('os.map.instance');
const {notifyStyleChange} = goog.require('os.style');
const TimelineController = goog.require('os.time.TimelineController');
const UnitManager = goog.require('os.unit.UnitManager');


/**
 * Updates all the current measure features
 */
const updateAll = function() {
  getMapContainer().getFeatures().filter(function(item) {
    var title = item.get('title');
    return title && title.indexOf('Measure') > -1;
  }).forEach(update);
};

/**
 * The decimal precision (number of digits after the decimal place) to use in formatting.
 * @type {number}
 */
const numDecimalPlaces = 3;

/**
 * @param {ol.Feature} feature
 * @suppress {accessControls}
 */
const update = function(feature) {
  if (!feature) {
    return;
  }

  var geom = /** @type {ol.geom.Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

  if (geom && geom instanceof LineString) {
    geom.toLonLat();

    var um = UnitManager.getInstance();
    var coords = geom.getCoordinates();
    var date = new Date(TimelineController.getInstance().getCurrent());

    if (coords) {
      var total = 0;
      for (var i = 1, n = coords.length; i < n; i++) {
        var coord = coords[i - 1];
        var result = osasm.geodesicInverse(coord, coords[i]);
        var d = result.distance;
        total += d;

        if (coord) {
          var bearing = modifyBearing(result.initialBearing, coord, date);
          var formattedBearing = getFormattedBearing(bearing);
          var label = um.formatToBestFit('distance', d, 'm', um.getBaseSystem(), numDecimalPlaces) +
              ' Bearing: ' + formattedBearing;
        }
        // get the style for the beginning of the segment
        // the first style is the style for the overall line

        /**
         * @type {Array<Array<ol.style.Style>>}
         */
        var styleArrs = [feature.getStyle(), feature.values_['_originalStyle']];
        for (var j = 0, m = styleArrs.length; j < m; j++) {
          if (i < styleArrs[j].length) {
            var style = styleArrs[j][i];
            if (style) {
              var text = style.getText();
              if (text) {
                text.setText(label);
              }
            }
          }

          if (i + 1 === n && n < styleArrs[j].length) {
            var totalLabel = um.formatToBestFit('distance', total, 'm', um.getBaseSystem(), numDecimalPlaces);
            style = styleArrs[j][n];
            if (style) {
              text = style.getText();
              if (text) {
                text.setText(totalLabel);
              }
            }
          }
        }
      }

      geom.osTransform();

      var layer = getLayer(feature);
      if (layer) {
        notifyStyleChange(layer);
      }
    }
  }
};

exports = {
  updateAll,
  numDecimalPlaces,
  update
};
