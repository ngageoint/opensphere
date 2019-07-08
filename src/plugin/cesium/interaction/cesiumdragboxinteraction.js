goog.provide('plugin.cesium.interaction.dragbox');

goog.require('os.interaction.DragBox');
goog.require('os.interaction.DrawPolygon');
goog.require('plugin.cesium');


/**
 * The Cesium box primitive.
 * @type {Cesium.Primitive|undefined}
 */
os.interaction.DragBox.prototype.cesiumBox = undefined;


/**
 * The Cesium box color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 */
os.interaction.DragBox.prototype.cesiumColor = undefined;


/**
 * Clean up the drag box interaction in Cesium.
 *
 * @this {os.interaction.DragBox}
 */
plugin.cesium.interaction.dragbox.cleanupWebGL = function() {
  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
    os.MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene && this.cesiumBox) {
    scene.groundPrimitives.remove(this.cesiumBox);
    this.cesiumBox = undefined;
  }
};


/**
 * Draw the box in Cesium.
 *
 * @param {ol.Coordinate} start The start coordinate.
 * @param {ol.Coordinate} end The end coordinate.
 * @this {os.interaction.DragBox}
 * @suppress {accessControls}
 */
plugin.cesium.interaction.dragbox.updateWebGL = function(start, end) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    if (!this.cesiumColor) {
      this.cesiumColor = new Cesium.ColorGeometryInstanceAttribute(
          Cesium.Color.byteToFloat(this.color[0]),
          Cesium.Color.byteToFloat(this.color[1]),
          Cesium.Color.byteToFloat(this.color[2]),
          this.color[3]);
    }

    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
      os.MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    start = ol.proj.toLonLat(start, this.getMap().getView().getProjection());
    end = ol.proj.toLonLat(end, this.getMap().getView().getProjection());

    if (scene && start && end) {
      if (this.cesiumBox) {
        scene.groundPrimitives.remove(this.cesiumBox);
      }

      var coords = /** @type {ol.geom.Polygon} */ (this.box2D.getGeometry()).getCoordinates()[0];
      var lonlats = coords.map(os.interaction.DrawPolygon.coordToLonLat);

      this.cesiumBox = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        geometryInstances: new Cesium.GeometryInstance({
          id: plugin.cesium.GeometryInstanceId.GEOM_OUTLINE,
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
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};
