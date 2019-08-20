goog.provide('os.annotation');
goog.provide('os.annotation.TailType');

goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('os.annotation.TailStyle');
goog.require('os.feature');
goog.require('os.ui');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.color.colorPickerDirective');


/**
 * The SVG tail CSS position.
 * @enum {string}
 */
os.annotation.TailType = {
  FIXED: 'fixed',
  ABSOLUTE: 'absolute'
};


/**
 * Default annotation options.
 * @type {osx.annotation.Options}
 * @const
 */
os.annotation.DEFAULT_OPTIONS = {
  editable: true,
  show: true,
  showBackground: true,
  showName: true,
  showDescription: true,
  showTail: os.annotation.TailStyle.DEFAULT,
  size: [200, 100],
  offset: [0, -75],
  headerBG: undefined,
  bodyBG: undefined
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
 * Height of an annotation being edited inline.
 *
 * @type {number}
 * @const
 */
os.annotation.EDIT_HEIGHT = 270;


/**
 * Width of an annotation being edited inline.
 *
 * @type {number}
 * @const
 */
os.annotation.EDIT_WIDTH = 570;


/**
 * Annotation event types.
 * @enum {string}
 */
os.annotation.EventType = {
  CHANGE: 'annotation:change',
  EDIT: 'annotation:edit',
  HIDE: 'annotation:hide',
  LAUNCH_EDIT: 'annotation:launchEdit',
  UPDATE_PLACEMARK: 'annotation:updatePlacemark'
};


/**
 * Feature field for storing annotation options.
 * @type {string}
 * @const
 */
os.annotation.OPTIONS_FIELD = '_annotationOptions';


/**
 * Generate annotation options to display the given text.
 *
 * @param {osx.annotation.Options} options The options.
 * @param {string} text The annotation text.
 */
os.annotation.scaleToText = function(options, text) {
  // compute the annotation size from the text. the height/width must include the text size, plus the header/padding.
  var size = os.ui.measureText(text, 'u-annotation__measure');

  var annotationHeight = size.height + 10 + (options.showName ? 25 : 0);
  annotationHeight = Math.min(annotationHeight, os.annotation.MAX_DEFAULT_HEIGHT);

  var annotationWidth = Math.min(size.width + 10, os.annotation.MAX_DEFAULT_WIDTH);
  options.size = [annotationWidth, annotationHeight];

  // display the annotation 25px above the target
  options.offset[1] = -(annotationHeight / 2) - 25;
};


/**
 * Get the name text for an annotation balloon.
 *
 * @param {ol.Feature} feature The feature.
 * @return {string} The text.
 */
os.annotation.getNameText = function(feature) {
  if (feature) {
    return /** @type {string|undefined} */ (feature.get(os.ui.FeatureEditCtrl.Field.NAME)) || '';
  }

  return '';
};


/**
 * Get the description text for an annotation balloon.
 *
 * @param {ol.Feature} feature The feature.
 * @return {string} The text.
 */
os.annotation.getDescriptionText = function(feature) {
  if (feature) {
    return /** @type {string|undefined} */ (feature.get(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION)) ||
    /** @type {string|undefined} */ (feature.get(os.ui.FeatureEditCtrl.Field.DESCRIPTION)) || '';
  }

  return '';
};


/**
 * If a feature has a map overlay present.
 *
 * @param {ol.Feature} feature The feature.
 * @return {boolean}
 */
os.annotation.hasOverlay = function(feature) {
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
 *
 * @param {!ol.Overlay} overlay The overlay.
 * @param {ol.Feature} feature The feature. Use null to hide the overlay.
 */
os.annotation.setPosition = function(overlay, feature) {
  var position;

  if (feature) {
    var geometry = feature.getGeometry();
    if (geometry && geometry.getType() === ol.geom.GeometryType.POINT) {
      // nothing fancy for points, just use the coordinate
      position = /** @type {ol.geom.Point} */ (geometry).getFirstCoordinate();
    } else {
      var map = overlay.getMap();
      var element = overlay.getElement();

      if (map && element) {
        var mapRect = os.annotation.getMapRect(overlay);
        var cardRect = element.getBoundingClientRect();
        cardRect.x -= mapRect.x;
        cardRect.y -= mapRect.y;

        var cardCenter = [cardRect.x + cardRect.width / 2, cardRect.y + cardRect.height / 2];
        var coordinate = map.getCoordinateFromPixel(cardCenter);

        if (!coordinate) {
          // TODO: when the card is off the edge of the map/globe, the nearestPoints method from JSTS blows up.
          // Fixing this correctly will require reimplementing the method to work in screen space. Instead, just
          // stop updating the anchor point until the annotation is back over the map.
          return;
        }

        var cardGeometry = new ol.geom.Point(coordinate);

        if (cardGeometry && geometry) {
          var coords = os.geo.jsts.nearestPoints(cardGeometry, geometry);
          position = coords[1];
        }
      }
    }
  }

  overlay.setPosition(position);
};


/**
 * Get the OpenLayers map bounding rectangle.
 *
 * @param {ol.Overlay} overlay The overlay to get the map rectangle from.
 * @return {ClientRect|undefined} The map bounding rectangle, or undefined if the map/overlay are not defined.
 */
os.annotation.getMapRect = function(overlay) {
  if (overlay) {
    var map = overlay.getMap();
    if (map) {
      var mapEl = map.getTargetElement();
      if (mapEl) {
        return mapEl.getBoundingClientRect();
      }
    }
  }

  return undefined;
};
