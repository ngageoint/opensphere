goog.provide('os.olcs.sync.DrawingLayerSynchronizer');

goog.require('ol.geom.Polygon');
goog.require('os.geo');
goog.require('os.olcs.sync.VectorSynchronizer');



/**
 * @param {!ol.layer.Vector} layer
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @extends {os.olcs.sync.VectorSynchronizer}
 * @constructor
 */
os.olcs.sync.DrawingLayerSynchronizer = function(layer, map, scene) {
  os.olcs.sync.DrawingLayerSynchronizer.base(this, 'constructor', layer, map, scene);
};
goog.inherits(os.olcs.sync.DrawingLayerSynchronizer, os.olcs.sync.VectorSynchronizer);


/**
 * @inheritDoc
 */
os.olcs.sync.DrawingLayerSynchronizer.prototype.initializePrimitive = function(primitive, feature) {
  os.olcs.sync.DrawingLayerSynchronizer.base(this, 'initializePrimitive', primitive, feature);

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
