goog.module('plugin.cesium.interaction.dragcircle');

const {toLonLat} = goog.require('ol.proj');
const Dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const MapEvent = goog.require('os.MapEvent');
const osInterpolate = goog.require('os.interpolate');
const osLabel = goog.require('os.style.label');
const UnitManager = goog.require('os.unit.UnitManager');
const {generateCirclePositions} = goog.require('plugin.cesium');

const DragCircle = goog.requireType('os.interaction.DragCircle');
const CesiumRenderer = goog.requireType('plugin.cesium.CesiumRenderer');


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
const cleanupWebGL = function() {
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
const updateWebGL = function(start, end) {
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
          font: osLabel.getFont(),
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
            arcType: osInterpolate.getMethod() === osInterpolate.Method.RHUMB ?
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

exports = {
  cleanupWebGL,
  updateWebGL
};
