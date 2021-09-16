goog.module('plugin.file.kml.export');

const annotation = goog.require('os.annotation');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');


/**
 * Get the KML balloon style options for an OpenLayers feature.
 *
 * @param {ol.Feature} feature The feature.
 * @return {?osx.annotation.KMLBalloon} The balloon options.
 */
const getBalloonOptions = function(feature) {
  var balloonOptions = null;

  if (feature) {
    var annotationOptions = /** @type {osx.annotation.Options} */ (feature.get(annotation.OPTIONS_FIELD));
    if (annotationOptions && annotationOptions.show) {
      var balloonParts = [];

      if (annotationOptions.showName) {
        var name = annotation.getNameText(feature);
        if (name) {
          balloonParts.push(name);
        }
      }

      if (annotationOptions.showDescription) {
        var description = annotation.getDescriptionText(feature);
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
const getRotationColumn = function(feature) {
  var rotColumn;
  if (feature) {
    rotColumn = /** @type {string|undefined} */ (feature.get(StyleField.ROTATION_COLUMN));

    var layerConfig = osStyle.getLayerConfig(feature);
    if ((!rotColumn && layerConfig) || (layerConfig && layerConfig[StyleField.REPLACE_STYLE])) {
      rotColumn = layerConfig[StyleField.ROTATION_COLUMN];
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
const getLineDash = function(feature) {
  if (feature) {
    var layerConfig = osStyle.getBaseFeatureConfig(feature);
    return osStyle.getConfigLineDash(Array.isArray(layerConfig) ? layerConfig[0] : layerConfig);
  }
  return undefined;
};

exports = {
  getBalloonOptions,
  getRotationColumn,
  getLineDash
};
