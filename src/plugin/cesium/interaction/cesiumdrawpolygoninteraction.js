goog.declareModuleId('plugin.cesium.interaction.drawpolygon');

import core from 'ol-cesium/src/olcs/core.js';

import * as dispatcher from '../../../os/dispatcher.js';
import DrawPolygon from '../../../os/interaction/drawpolygoninteraction.js';
import * as osInterpolate from '../../../os/interpolate.js';
import Method from '../../../os/interpolatemethod.js';
import MapEvent from '../../../os/map/mapevent.js';
import MapContainer from '../../../os/mapcontainer.js';



/**
 * The Cesium line color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 * @protected
 */
let cesiumColor = undefined;


/**
 * The Cesium lines.
 * @type {Cesium.GroundPolylinePrimitive|undefined}
 * @protected
 */
let cesiumLine = undefined;


/**
 * Clean up the draw polygon interaction in Cesium.
 *
 * @this {DrawPolygon}
 */
export const cleanupWebGL = function() {
  var webgl = /** @type {CesiumRenderer|undefined} */ (
    MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    cesiumColor = undefined;

    if (cesiumLine) {
      scene.groundPrimitives.remove(cesiumLine);
      cesiumLine = undefined;
    }
  }
};

/**
 * Draw the polygon in Cesium.
 *
 * @this {DrawPolygon}
 * @suppress {accessControls}
 */
export const updateWebGL = function() {
  if (MapContainer.getInstance().is3DEnabled()) {
    if (!cesiumColor) {
      cesiumColor = new Cesium.ColorGeometryInstanceAttribute(
          Cesium.Color.byteToFloat(this.color[0]),
          Cesium.Color.byteToFloat(this.color[1]),
          Cesium.Color.byteToFloat(this.color[2]),
          this.color[3]);
    }

    var webgl = /** @type {CesiumRenderer|undefined} */ (
      MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    var coords = /** @type {LineString} */ (this.line2D.getGeometry()).getCoordinates();
    var lonlats = coords.map(DrawPolygon.coordToLonLat);

    var l = lonlats.length;
    if (l > 1 && Math.abs(lonlats[l - 1][0] - lonlats[l - 2][0]) < 1E-12 &&
        Math.abs(lonlats[l - 1][1] - lonlats[l - 2][1]) < 1E-12) {
      // the last two coords are the same
      lonlats.length--;
    }

    if (scene && lonlats.length > 1) {
      if (cesiumLine) {
        scene.groundPrimitives.remove(cesiumLine);
      }


      cesiumLine = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        appearance: new Cesium.PolylineColorAppearance(),
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.GroundPolylineGeometry({
            positions: core.ol4326CoordinateArrayToCsCartesians(lonlats),
            arcType: osInterpolate.getMethod() === Method.RHUMB ?
              Cesium.ArcType.RHUMB : Cesium.ArcType.GEODESIC,
            width: 2
          }),
          attributes: {
            color: cesiumColor
          }
        })
      });

      scene.groundPrimitives.add(cesiumLine);
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }
};
