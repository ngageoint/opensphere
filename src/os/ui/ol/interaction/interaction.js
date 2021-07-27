goog.module('os.ui.ol.interaction');
goog.module.declareLegacyNamespace();

const userAgent = goog.require('goog.userAgent');
const EventType = goog.require('ol.events.EventType');
const {isGeometryPolygonal} = goog.require('os.geo');

const Feature = goog.requireType('ol.Feature');
const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');
const Layer = goog.requireType('ol.layer.Layer');
const RenderFeature = goog.requireType('ol.render.Feature');


/**
 * If true, keyboard interactions will fire on keydown. Otherwise, they will fire on keypress.
 * @type {boolean}
 */
const USES_KEYDOWN = userAgent.IE ||
    userAgent.EDGE ||
    (userAgent.WEBKIT && userAgent.isVersionOrHigher('525')) ||
    (userAgent.GECKO && userAgent.isVersionOrHigher('65'));

/**
 * The keyboard interaction event type.
 * @type {string}
 */
const KEY_TYPE = USES_KEYDOWN ? EventType.KEYDOWN : EventType.KEYPRESS;

/**
 * Get the first feature under the pixel in a map browser event.
 *
 * @param {MapBrowserEvent} event Map browser event.
 * @param {function((Feature|RenderFeature), Layer):T=} opt_callback Feature hit detection callback
 * @return {Feature} The first feature under the event pixel, or null if none was found.
 * @template T
 */
const getEventFeature = function(event, opt_callback) {
  if (event && event.map && event.pixel) {
    var callback = opt_callback || getFirstFeature;
    return event.map.forEachFeatureAtPixel(event.pixel, callback);
  }

  return null;
};

/**
 * Feature callback to return the first feature with a polygon geometry.
 *
 * @param {Feature|RenderFeature} feature
 * @param {Layer} layer Layer
 * @return {Feature|RenderFeature}
 */
const getFirstFeature = function(feature, layer) {
  return feature;
};

/**
 * Feature callback to return the first feature with a polygon geometry.
 *
 * @param {Feature|RenderFeature} feature
 * @param {Layer} layer Layer
 * @return {Feature|RenderFeature}
 */
const getFirstPolygon = function(feature, layer) {
  if (feature) {
    var geometry = feature.getGeometry();
    if (isGeometryPolygonal(geometry)) {
      return feature;
    }
  }

  return null;
};

exports = {
  USES_KEYDOWN,
  KEY_TYPE,
  getEventFeature,
  getFirstFeature,
  getFirstPolygon
};
