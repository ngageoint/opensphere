goog.provide('plugin.file.kml.export');

goog.require('os.annotation');
goog.require('os.style');
goog.require('os.style.StyleField');


/**
 * Get the KML balloon style options for an OpenLayers feature.
 *
 * @param {ol.Feature} feature The feature.
 * @return {?osx.annotation.KMLBalloon} The balloon options.
 */
plugin.file.kml.export.getBalloonOptions = function(feature) {
  var balloonOptions = null;

  if (feature) {
    var annotationOptions = /** @type {osx.annotation.Options} */ (feature.get(os.annotation.OPTIONS_FIELD));
    if (annotationOptions && annotationOptions.show) {
      var balloonParts = [];

      if (annotationOptions.showName) {
        var name = os.annotation.getNameText(feature);
        if (name) {
          balloonParts.push(name);
        }
      }

      if (annotationOptions.showDescription) {
        var description = os.annotation.getDescriptionText(feature);
        if (description) {
          balloonParts.push(description);
        }
      }

      if (balloonParts.length) {
        var text = balloonParts.join('<br/>');
        text = text.replace(/\n/g, '<br/>');

        balloonOptions = /** @type {osx.annotation.KMLBalloon} */ ({
          text: text
        });
      }
    }
  }

  return balloonOptions;
};


/**
 * Get the icon rotation column for an OpenLayers feature.
 *
 * @param {ol.Feature} feature The feature.
 * @return {string|undefined} The column.
 */
plugin.file.kml.export.getRotationColumn = function(feature) {
  var rotColumn;
  if (feature) {
    rotColumn = /** @type {string|undefined} */ (feature.get(os.style.StyleField.ROTATION_COLUMN));

    var layerConfig = os.style.getLayerConfig(feature);
    if (!rotColumn || layerConfig && layerConfig[os.style.StyleField.REPLACE_STYLE]) {
      rotColumn = layerConfig[os.style.StyleField.ROTATION_COLUMN];
    }
  }

  // don't return an empty string
  return rotColumn;
};

/**
 * Get the line dash for an OpenLayers feature.
 *
 * @param {ol.Feature} feature The feature.
 * @return {Array<number>|null|undefined} The line dash.
 */
plugin.file.kml.export.getLineDash = function(feature) {
  if (feature) {
    var layerConfig = os.style.getBaseFeatureConfig(feature);
    return os.style.getConfigLineDash(goog.isArray(layerConfig) ? layerConfig[0] : layerConfig);
  }
  return undefined;
};
