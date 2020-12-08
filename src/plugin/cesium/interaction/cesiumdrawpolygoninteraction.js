goog.module('plugin.cesium.interaction.drawpolygon');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const core = goog.require('olcs.core');
const DrawPolygon = goog.require('os.interaction.DrawPolygon');


/**
 * The Cesium line color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 * @protected
 */
DrawPolygon.prototype.cesiumColor = undefined;


/**
 * The Cesium lines.
 * @type {Cesium.GroundPolylinePrimitive|undefined}
 * @protected
 */
DrawPolygon.prototype.cesiumLine = undefined;


/**
 * Clean up the draw polygon interaction in Cesium.
 *
 * @this {DrawPolygon}
 */
const cleanupWebGL = function() {
  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
    MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    this.cesiumColor = undefined;

    if (this.cesiumLine) {
      scene.groundPrimitives.remove(this.cesiumLine);
      this.cesiumLine = undefined;
    }
  }
};

/**
 * Draw the polygon in Cesium.
 *
 * @this {DrawPolygon}
 * @suppress {accessControls}
 */
const updateWebGL = function() {
  if (MapContainer.getInstance().is3DEnabled()) {
    if (!this.cesiumColor) {
      this.cesiumColor = new Cesium.ColorGeometryInstanceAttribute(
          Cesium.Color.byteToFloat(this.color[0]),
          Cesium.Color.byteToFloat(this.color[1]),
          Cesium.Color.byteToFloat(this.color[2]),
          this.color[3]);
    }

    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
      MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    var coords = /** @type {ol.geom.LineString} */ (this.line2D.getGeometry()).getCoordinates();
    var lonlats = coords.map(DrawPolygon.coordToLonLat);

    var l = lonlats.length;
    if (l > 1 && Math.abs(lonlats[l - 1][0] - lonlats[l - 2][0]) < 1E-12 &&
        Math.abs(lonlats[l - 1][1] - lonlats[l - 2][1]) < 1E-12) {
      // the last two coords are the same
      lonlats.length--;
    }

    if (scene && lonlats.length > 1) {
      if (this.cesiumLine) {
        scene.groundPrimitives.remove(this.cesiumLine);
      }


      this.cesiumLine = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        appearance: new Cesium.PolylineColorAppearance(),
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.GroundPolylineGeometry({
            positions: core.ol4326CoordinateArrayToCsCartesians(lonlats),
            arcType: os.interpolate.getMethod() === os.interpolate.Method.RHUMB ?
              Cesium.ArcType.RHUMB : Cesium.ArcType.GEODESIC,
            width: 2
          }),
          attributes: {
            color: this.cesiumColor
          }
        })
      });

      scene.groundPrimitives.add(this.cesiumLine);
      dispatcher.getInstance().dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};

exports = {
  cleanupWebGL,
  updateWebGL
};
