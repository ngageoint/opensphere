goog.provide('os.ui.ol.interaction');

goog.require('os.geo');


/**
 * If true, keyboard interactions will fire on keydown. Otherwise, they will fire on keypress.
 * @type {boolean}
 * @const
 */
os.ui.ol.interaction.USES_KEYDOWN = goog.userAgent.IE ||
    goog.userAgent.EDGE ||
    goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher('525');


/**
 * The keyboard interaction event type.
 * @type {string}
 * @const
 */
os.ui.ol.interaction.KEY_TYPE = os.ui.ol.interaction.USES_KEYDOWN ? ol.events.EventType.KEYDOWN :
    ol.events.EventType.KEYPRESS;


/**
 * Get the first feature under the pixel in a map browser event.
 * @param {ol.MapBrowserEvent} event Map browser event.
 * @param {function((ol.Feature|ol.render.Feature), ol.layer.Layer):T=} opt_callback Feature hit detection callback
 * @return {ol.Feature} The first feature under the event pixel, or null if none was found.
 * @template T
 */
os.ui.ol.interaction.getEventFeature = function(event, opt_callback) {
  if (event && event.map && event.pixel) {
    var callback = opt_callback || os.ui.ol.interaction.getFirstFeature;
    return event.map.forEachFeatureAtPixel(event.pixel, callback);
  }

  return null;
};


/**
 * Feature callback to return the first feature with a polygon geometry.
 * @param {ol.Feature|ol.render.Feature} feature
 * @param {ol.layer.Layer} layer Layer
 * @return {ol.Feature|ol.render.Feature}
 */
os.ui.ol.interaction.getFirstFeature = function(feature, layer) {
  return feature;
};


/**
 * Feature callback to return the first feature with a polygon geometry.
 * @param {ol.Feature|ol.render.Feature} feature
 * @param {ol.layer.Layer} layer Layer
 * @return {ol.Feature|ol.render.Feature}
 */
os.ui.ol.interaction.getFirstPolygon = function(feature, layer) {
  if (feature) {
    var geometry = feature.getGeometry();
    if (os.geo.isGeometryPolygonal(geometry)) {
      return feature;
    }
  }

  return null;
};
