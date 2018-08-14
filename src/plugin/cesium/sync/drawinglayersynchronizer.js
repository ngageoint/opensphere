goog.provide('plugin.cesium.sync.DrawingLayerSynchronizer');

goog.require('ol.geom.Polygon');
goog.require('os.geo');
goog.require('plugin.cesium.sync.VectorSynchronizer');


/**
 * Synchronizes the OpenSphere drawing layer to Cesium.
 * @param {!ol.layer.Vector} layer The drawing layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {plugin.cesium.sync.VectorSynchronizer}
 * @constructor
 */
plugin.cesium.sync.DrawingLayerSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.DrawingLayerSynchronizer.base(this, 'constructor', layer, map, scene);
};
goog.inherits(plugin.cesium.sync.DrawingLayerSynchronizer, plugin.cesium.sync.VectorSynchronizer);


/**
 * @inheritDoc
 */
plugin.cesium.sync.DrawingLayerSynchronizer.prototype.initializePrimitive = function(primitive, feature) {
  plugin.cesium.sync.DrawingLayerSynchronizer.base(this, 'initializePrimitive', primitive, feature);

  if (primitive instanceof Cesium.PrimitiveCollection && primitive.length > 0) {
    var thing = /** @type {Cesium.PrimitiveCollection} */ (primitive).get(0);
    thing['olFeature'] = feature;
  }

  if (thing && feature) {
    // If this feature is a rectangle, then switch to a RectangleOutlineGeometry
    try {
      var polygon = /** @type {ol.geom.Polygon} */ (feature.getGeometry());
      if (polygon instanceof ol.geom.Polygon) {
        var coords = polygon.getCoordinates();
        var extent = polygon.getExtent();

        if (coords.length == 1 && os.geo.isRectangular(coords[0], polygon.getExtent())) {
          thing.geometryInstances.geometry = new Cesium.RectangleOutlineGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
          });
        }
      }
    } catch (e) {
    }
  }
};
