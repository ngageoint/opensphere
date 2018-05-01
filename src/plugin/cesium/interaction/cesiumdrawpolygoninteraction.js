goog.provide('plugin.cesium.interaction.drawpolygon');

goog.require('olcs.core');
goog.require('os.interaction.DrawPolygon');


/**
 * The Cesium line color.
 * @type {Cesium.Color|undefined}
 * @protected
 */
os.interaction.DrawPolygon.prototype.cesiumColor = undefined;


/**
 * The Cesium lines.
 * @type {Cesium.PolylineCollection|undefined}
 * @protected
 */
os.interaction.DrawPolygon.prototype.cesiumLines = undefined;


/**
 * Add Cesium support to a draw polygon interaction.
 * @param {!os.interaction.DrawPolygon} interaction The draw polygon interaction.
 */
plugin.cesium.interaction.drawpolygon.initialize = function(interaction) {
  interaction.cleanupWebGL = plugin.cesium.interaction.drawpolygon.cleanupWebGL;
  interaction.updateWebGL = plugin.cesium.interaction.drawpolygon.updateWebGL;
};


/**
 * Clean up the draw polygon interaction in Cesium.
 * @this {os.interaction.DrawPolygon}
 */
plugin.cesium.interaction.drawpolygon.cleanupWebGL = function() {
  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
      os.MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    this.cesiumColor = undefined;

    if (this.cesiumLines) {
      scene.primitives.remove(this.cesiumLines);
      this.cesiumLines = undefined;
    }
  }
};


/**
 * Draw the polygon in Cesium.
 * @this {os.interaction.DrawPolygon}
 * @suppress {accessControls}
 */
plugin.cesium.interaction.drawpolygon.updateWebGL = function() {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    if (!this.cesiumColor) {
      this.cesiumColor = olcs.core.convertColorToCesium(this.color);
    }

    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
        os.MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    var coords = /** @type {ol.geom.LineString} */ (this.line2D.getGeometry()).getCoordinates();
    var lonlats = coords.map(os.interaction.DrawPolygon.coordToLonLat);

    if (scene && lonlats.length > 0) {
      if (this.cesiumLines) {
        this.cesiumLines.removeAll();
      } else {
        this.cesiumLines = new Cesium.PolylineCollection();
        scene.primitives.add(this.cesiumLines);
      }

      this.cesiumLines.add({
        asynchronous: false,
        show: true,
        material: Cesium.Material.fromType(Cesium.Material.ColorType, {
          color: this.cesiumColor
        }),
        positions: Cesium.PolylinePipeline.generateCartesianArc({
          positions: olcs.core.ol4326CoordinateArrayToCsCartesians(lonlats)
        }),
        width: 2
      });

      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};
