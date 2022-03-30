goog.declareModuleId('plugin.cesium.interaction.dragcircle');

import {toLonLat} from 'ol/src/proj.js';

import * as Dispatcher from '../../../os/dispatcher.js';
import * as osInterpolate from '../../../os/interpolate.js';
import Method from '../../../os/interpolatemethod.js';
import MapEvent from '../../../os/map/mapevent.js';
import MapContainer from '../../../os/mapcontainer.js';
import {getFont} from '../../../os/style/label.js';
import UnitManager from '../../../os/unit/unitmanager.js';
import {generateCirclePositions} from '../cesium.js';

const {default: DragCircle} = goog.requireType('os.interaction.DragCircle');
const {default: CesiumRenderer} = goog.requireType('plugin.cesium.CesiumRenderer');


/**
 * The Cesium circle primitive.
 * @type {Cesium.Primitive|undefined}
 */
let cesiumCircle = undefined;

/**
 * The Cesium label collection.
 * @type {Cesium.LabelCollection|undefined}
 */
let cesiumLabels = undefined;

/**
 * The Cesium label.
 * @type {Cesium.Label|undefined}
 */
let cesiumLabel = undefined;

/**
 * The Cesium circle color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 */
let cesiumColor = undefined;


/**
 * Clean up the drag circle interaction in Cesium.
 *
 * @this {DragCircle}
 */
export const cleanupWebGL = function() {
  var webgl = /** @type {CesiumRenderer|undefined} */ (MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    if (cesiumCircle) {
      scene.groundPrimitives.remove(cesiumCircle);
    }

    if (cesiumLabels) {
      scene.groundPrimitives.remove(cesiumLabels);
    }

    cesiumCircle = undefined;
    cesiumLabels = undefined;
    cesiumLabel = undefined;
  }
};

/**
 * Draw the circle in Cesium.
 *
 * @param {ol.Coordinate} start The start coordinate.
 * @param {ol.Coordinate} end The end coordinate.
 * @this {DragCircle}
 * @suppress {accessControls}
 */
export const updateWebGL = function(start, end) {
  if (MapContainer.getInstance().is3DEnabled()) {
    if (!cesiumColor) {
      cesiumColor = new Cesium.ColorGeometryInstanceAttribute(0, 1, 1, 1);
    }

    var webgl = /** @type {CesiumRenderer|undefined} */ (MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    start = toLonLat(start, this.getMap().getView().getProjection());
    end = toLonLat(end, this.getMap().getView().getProjection());

    if (scene && start && end && this.distance) {
      if (!cesiumLabels) {
        cesiumLabels = new Cesium.LabelCollection({
          scene: scene
        });
        scene.groundPrimitives.add(cesiumLabels);
      }

      var center = Cesium.Cartesian3.fromDegrees(start[0], start[1]);
      var um = UnitManager.getInstance();
      var labelText = um.formatToBestFit('distance', this.distance, 'm', um.getBaseSystem(), 3);

      if (!cesiumLabel) {
        cesiumLabel = cesiumLabels.add(/** @type {Cesium.optionsLabelCollection} */ ({
          position: center,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: false,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          font: getFont(),
          text: labelText
        }));
      }

      if (cesiumCircle) {
        scene.groundPrimitives.remove(cesiumCircle);
      }

      cesiumCircle = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        appearance: new Cesium.PolylineColorAppearance(),
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.GroundPolylineGeometry({
            positions: generateCirclePositions(center, this.distance),
            arcType: osInterpolate.getMethod() === Method.RHUMB ?
              Cesium.ArcType.RHUMB : Cesium.ArcType.GEODESIC,
            width: 2
          }),
          attributes: {
            color: cesiumColor
          }
        })
      });

      cesiumLabel.position = center;
      cesiumLabel.text = labelText;
      cesiumLabel.show = true;

      scene.groundPrimitives.add(cesiumCircle);
      Dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }
};
