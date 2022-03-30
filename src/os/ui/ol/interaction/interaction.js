goog.declareModuleId('os.ui.ol.interaction');

import EventType from 'ol/src/events/EventType.js';

import {isGeometryPolygonal} from '../../../geo/geo.js';

const userAgent = goog.require('goog.userAgent');

/**
 * If true, keyboard interactions will fire on keydown. Otherwise, they will fire on keypress.
 * @type {boolean}
 */
export const USES_KEYDOWN = userAgent.IE ||
    userAgent.EDGE ||
    (userAgent.WEBKIT && userAgent.isVersionOrHigher('525')) ||
    (userAgent.GECKO && userAgent.isVersionOrHigher('65'));

/**
 * The keyboard interaction event type.
 * @type {string}
 */
export const KEY_TYPE = USES_KEYDOWN ? EventType.KEYDOWN : EventType.KEYPRESS;

/**
 * Get the first feature under the pixel in a map browser event.
 *
 * @param {MapBrowserEvent} event Map browser event.
 * @param {function((Feature|RenderFeature), Layer):T=} opt_callback Feature hit detection callback
 * @return {Feature} The first feature under the event pixel, or null if none was found.
 * @template T
 */
export const getEventFeature = function(event, opt_callback) {
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
export const getFirstFeature = function(feature, layer) {
  return feature;
};

/**
 * Feature callback to return the first feature with a polygon geometry.
 *
 * @param {Feature|RenderFeature} feature
 * @param {Layer} layer Layer
 * @return {Feature|RenderFeature}
 */
export const getFirstPolygon = function(feature, layer) {
  if (feature) {
    var geometry = feature.getGeometry();
    if (isGeometryPolygonal(geometry)) {
      return feature;
    }
  }

  return null;
};
