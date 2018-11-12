goog.provide('os.annotation');

goog.require('ol.geom.GeometryType');
goog.require('os.ui');


/**
 * Default annotation options.
 * @type {osx.annotation.Options}
 * @const
 */
os.annotation.DEFAULT_OPTIONS = {
  editable: true,
  show: true,
  showName: true,
  showDescription: true,
  size: [200, 100],
  offset: [0, -75]
};


/**
 * Maximum annotation height when computing size from text.
 * @type {number}
 * @const
 */
os.annotation.MAX_DEFAULT_HEIGHT = 350;


/**
 * Maximum annotation width when computing size from text.
 *
 * This size must correspond to the `max-width` in `.u-annotation__measure` for accurate size calculation.
 *
 * @type {number}
 * @const
 */
os.annotation.MAX_DEFAULT_WIDTH = 350;


/**
 * Annotation event types.
 * @enum {string}
 */
os.annotation.EventType = {
  CHANGE: 'annotation:change',
  EDIT: 'annotation:edit'
};


/**
 * Feature field for storing annotation options.
 * @type {string}
 * @const
 */
os.annotation.OPTIONS_FIELD = '_annotationOptions';


/**
 * Generate annotation options to display the given text.
 * @param {string} text The annotation text.
 * @return {osx.annotation.Options} The options.
 */
os.annotation.getOptionsForText = function(text) {
  var annotationOptions = /** @type {osx.annotation.Options} */ (os.object.unsafeClone(os.annotation.DEFAULT_OPTIONS));

  // compute the annotation size from the text. the height/width must include the text size, plus the header/padding.
  var size = os.ui.measureText(text, 'u-annotation__measure');
  var annotationHeight = Math.min(size.height + 35, os.annotation.MAX_DEFAULT_HEIGHT);
  var annotationWidth = Math.min(size.width + 10, os.annotation.MAX_DEFAULT_WIDTH);
  annotationOptions.size = [annotationWidth, annotationHeight];

  // display the annotation 25px above the target
  annotationOptions.offset[1] = -(annotationHeight / 2) - 25;

  return annotationOptions;
};


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
