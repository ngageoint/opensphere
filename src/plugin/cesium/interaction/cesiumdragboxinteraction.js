goog.declareModuleId('plugin.cesium.interaction.dragbox');

import olcsCore from 'ol-cesium/src/olcs/core.js';

import * as Dispatcher from '../../../os/dispatcher.js';
import DrawPolygon from '../../../os/interaction/drawpolygoninteraction.js';
import MapEvent from '../../../os/map/mapevent.js';
import MapContainer from '../../../os/mapcontainer.js';
import {GeometryInstanceId} from '../cesium.js';


/**
 * The Cesium box primitive.
 * @type {Cesium.Primitive|undefined}
 */
let cesiumBox = undefined;


/**
 * The Cesium box color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 */
let cesiumColor = undefined;


/**
 * Clean up the drag box interaction in Cesium.
 *
 * @this {DragBox}
 */
export const cleanupWebGL = function() {
  var webgl = /** @type {CesiumRenderer|undefined} */ (MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene && cesiumBox) {
    scene.groundPrimitives.remove(cesiumBox);
    cesiumBox = undefined;
  }
};

/**
 * Draw the box in Cesium.
 * @param {Polygon} geometry
 * @this {DragBox}
 * @suppress {accessControls}
 */
export const updateWebGL = function(geometry) {
  if (MapContainer.getInstance().is3DEnabled()) {
    if (!cesiumColor) {
      cesiumColor = new Cesium.ColorGeometryInstanceAttribute(
          Cesium.Color.byteToFloat(this.color[0]),
          Cesium.Color.byteToFloat(this.color[1]),
          Cesium.Color.byteToFloat(this.color[2]),
          this.color[3]);
    }

    var webgl = /** @type {CesiumRenderer|undefined} */ (MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    if (scene && geometry) {
      if (cesiumBox) {
        scene.groundPrimitives.remove(cesiumBox);
      }

      var coords = geometry.getCoordinates()[0];
      var lonlats = coords.map(DrawPolygon.coordToLonLat);

      cesiumBox = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        geometryInstances: new Cesium.GeometryInstance({
          id: GeometryInstanceId.GEOM_OUTLINE,
          geometry: new Cesium.GroundPolylineGeometry({
            positions: olcsCore.ol4326CoordinateArrayToCsCartesians(lonlats),
            arcType: Cesium.ArcType.RHUMB,
            width: 2
          }),
          attributes: {
            color: cesiumColor
          }
        }),
        appearance: new Cesium.PolylineColorAppearance()
      });

      scene.groundPrimitives.add(cesiumBox);
      Dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }
};
