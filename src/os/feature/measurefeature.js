goog.provide('os.feature.measure');

goog.require('os.bearing');
goog.require('os.feature');
goog.require('os.geo');
goog.require('os.style');
goog.require('os.unit.UnitManager');


/**
 * Updates all the current measure features
 */
os.feature.measure.updateAll = function() {
  os.MapContainer.getInstance().getFeatures().filter(function(item) {
    var title = item.get('title');
    return title && title.indexOf('Measure') > -1;
  }).forEach(os.feature.measure.update);
};


/**
 * The decimal precision (number of digits after the decimal place) to use in formatting.
 * @type {number}
 */
os.feature.measure.numDecimalPlaces = 3;


/**
 * @param {ol.Feature} feature
 * @suppress {accessControls}
 */
os.feature.measure.update = function(feature) {
  if (!feature) {
    return;
  }

  var geom = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

  if (geom && geom instanceof ol.geom.LineString) {
    geom.toLonLat();

    var um = os.unit.UnitManager.getInstance();
    var coords = geom.getCoordinates();

    if (coords) {
      var total = 0;
      for (var i = 1, n = coords.length; i < n; i++) {
        var coord = coords[i - 1];
        var result = osasm.geodesicInverse(coord, coords[i]);
        var d = result.distance;
        total += d;
        var bearing = os.bearing.modifyBearing(result.initialBearing, coord);
        var formattedBearing = os.bearing.getFormattedBearing(bearing);
        var label = um.formatToBestFit('distance', d, 'm', um.getBaseSystem(), os.feature.measure.numDecimalPlaces) +
            ' Bearing: ' + formattedBearing;
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
            var totalLabel = um.formatToBestFit('distance', total, 'm', um.getBaseSystem(),
                os.feature.measure.numDecimalPlaces);
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

      var layer = os.feature.getLayer(feature);
      if (layer) {
        os.style.notifyStyleChange(layer);
      }
    }
  }
};
