goog.provide('os.annotation');

goog.require('ol.geom.GeometryType');


/**
 * Default annotation options.
 * @type {osx.annotation.Options}
 * @const
 */
os.annotation.DEFAULT_OPTIONS = {
  show: true,
  showName: true,
  showDescription: true,
  size: [200, 100],
  offset: [0, -75]
};


/**
 * Event type for annotation changes.
 * @type {string}
 * @const
 */
os.annotation.CHANGE_EVENT = 'change:annotation';


/**
 * Feature field for storing annotation options.
 * @type {string}
 * @const
 */
os.annotation.OPTIONS_FIELD = '_annotationOptions';


/**
 * If a feature has a map overlay present.
 * @param {ol.Feature} feature The feature.
 * @return {boolean}
 */
os.annotation.hasAnnotation = function(feature) {
  if (feature) {
    var map = os.MapContainer.getInstance().getMap();
    if (map) {
      return !!map.getOverlayById(ol.getUid(feature));
    }
  }

  return false;
};


/**
 * Set the target map position for an overlay.
 * @param {!ol.Overlay} overlay The overlay.
 * @param {ol.Feature} feature The feature. Use null to hide the overlay.
 */
os.annotation.setPosition = function(overlay, feature) {
  var position;

  if (feature) {
    var geometry = feature.getGeometry();
    if (geometry && geometry.getType() === ol.geom.GeometryType.POINT) {
      position = /** @type {ol.geom.Point} */ (geometry).getFirstCoordinate();
    }
  }

  overlay.setPosition(position);
};
