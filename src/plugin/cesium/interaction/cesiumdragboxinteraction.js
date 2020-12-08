goog.module('plugin.cesium.interaction.dragbox');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const DragBox = goog.require('os.interaction.DragBox');
const DrawPolygon = goog.require('os.interaction.DrawPolygon');
const cesium = goog.require('plugin.cesium');


/**
 * The Cesium box primitive.
 * @type {Cesium.Primitive|undefined}
 */
DragBox.prototype.cesiumBox = undefined;


/**
 * The Cesium box color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 */
DragBox.prototype.cesiumColor = undefined;


/**
 * Clean up the drag box interaction in Cesium.
 *
 * @this {DragBox}
 */
const cleanupWebGL = function() {
  var webgl = /** @type {cesium.CesiumRenderer|undefined} */ (
    MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene && this.cesiumBox) {
    scene.groundPrimitives.remove(this.cesiumBox);
    this.cesiumBox = undefined;
  }
};

/**
 * Draw the box in Cesium.
 * @param {ol.geom.Polygon} geometry
 * @this {DragBox}
 * @suppress {accessControls}
 */
const updateWebGL = function(geometry) {
  if (MapContainer.getInstance().is3DEnabled()) {
    if (!this.cesiumColor) {
      this.cesiumColor = new Cesium.ColorGeometryInstanceAttribute(
          Cesium.Color.byteToFloat(this.color[0]),
          Cesium.Color.byteToFloat(this.color[1]),
          Cesium.Color.byteToFloat(this.color[2]),
          this.color[3]);
    }

    var webgl = /** @type {cesium.CesiumRenderer|undefined} */ (
      MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    if (scene && geometry) {
      if (this.cesiumBox) {
        scene.groundPrimitives.remove(this.cesiumBox);
      }

      var coords = geometry.getCoordinates()[0];
      var lonlats = coords.map(DrawPolygon.coordToLonLat);

      this.cesiumBox = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        geometryInstances: new Cesium.GeometryInstance({
          id: cesium.GeometryInstanceId.GEOM_OUTLINE,
          geometry: new Cesium.GroundPolylineGeometry({
            positions: olcs.core.ol4326CoordinateArrayToCsCartesians(lonlats),
            arcType: Cesium.ArcType.RHUMB,
            width: 2
          }),
          attributes: {
            color: this.cesiumColor
          }
        }),
        appearance: new Cesium.PolylineColorAppearance()
      });

      scene.groundPrimitives.add(this.cesiumBox);
      dispatcher.getInstance().dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};

exports = {
  cleanupWebGL,
  updateWebGL
};
