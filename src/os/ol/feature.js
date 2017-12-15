goog.provide('os.ol.feature');
goog.require('ol.Feature');
goog.require('ol.geom.Circle');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');


/**
 * OL3 geometry classes supported by {@link os.ol.feature.cloneGeometry}.
 * @enum {function (new:ol.geom.SimpleGeometry, ?)}
 */
os.ol.feature.GEOMETRIES = {
  'Point': ol.geom.Point,
  'LineString': ol.geom.LineString,
  'LinearRing': ol.geom.LinearRing,
  'Polygon': ol.geom.Polygon,
  'MultiPoint': ol.geom.MultiPoint,
  'MultiLineString': ol.geom.MultiLineString,
  'MultiPolygon': ol.geom.MultiPolygon,
  'Circle': ol.geom.Circle
};


/**
 * Clones a feature. This avoids copying style information since we handle styles very differently than base OL3.
 * @param {!ol.Feature} feature The feature to clone
 * @param {Array<string>=} opt_propertyKeys Keys of properties to copy from the original feature
 * @return {!ol.Feature} The cloned feature
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ol.feature.clone = function(feature, opt_propertyKeys) {
  var clone = new ol.Feature();
  var geometryName = feature.getGeometryName();
  clone.setGeometryName(geometryName);

  var geometry = feature.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    clone.setGeometry(os.ol.feature.cloneGeometry(geometry));
  }

  if (opt_propertyKeys) {
    for (var i = 0, ii = opt_propertyKeys.length; i < ii; i++) {
      var key = opt_propertyKeys[i];
      if (feature.values_[key] != null && key != geometryName) {
        // only copy if it isn't null/undefined or the feature's geometry
        clone.values_[key] = feature.values_[key];
      }
    }
  }

  return clone;
};


/**
 * Clones a geometry, verifying it's created in the current window context. This will ensure OL3's instanceof assertions
 * on the geometry do not fail.
 * @param {T} geometry The geometry to clone
 * @return {T}
 * @template T
 */
os.ol.feature.cloneGeometry = function(geometry) {
  var type = geometry.getType();
  var clazz = os.ol.feature.GEOMETRIES[type];
  if (clazz && !(geometry instanceof clazz)) {
    return clazz.prototype.clone.call(geometry);
  } else {
    return geometry.clone();
  }
};


/**
 * Compares its two feature property values, using the built in < and > operators. This intentionally inlines functions
 * to improve performance.
 *
 * @param {string} field The field to compare. Inject using goog.bind or goog.partial.
 * @param {!ol.Feature} a The first feature to be compared.
 * @param {!ol.Feature} b The second feature to be compared.
 * @return {number} A negative number, zero, or a positive number as the first argument is less than, equal to, or
 *                    greater than the second, respectively.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ol.feature.fieldSort = function(field, a, b) {
  var av = a.values_[field];
  var bv = b.values_[field];
  return av > bv ? 1 : av < bv ? -1 : 0;
};
