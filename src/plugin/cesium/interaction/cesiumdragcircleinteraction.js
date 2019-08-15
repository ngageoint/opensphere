goog.provide('plugin.cesium.interaction.dragcircle');

goog.require('os.interaction.DragCircle');
goog.require('plugin.cesium');


/**
 * The Cesium circle primitive.
 * @type {Cesium.Primitive|undefined}
 */
os.interaction.DragCircle.prototype.cesiumCircle = undefined;

/**
 * The Cesium label collection.
 * @type {Cesium.LabelCollection|undefined}
 */
os.interaction.DragCircle.prototype.cesiumLabels = undefined;

/**
 * The Cesium label.
 * @type {Cesium.Label|undefined}
 */
os.interaction.DragCircle.prototype.cesiumLabel = undefined;

/**
 * The Cesium circle color.
 * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
 */
os.interaction.DragCircle.prototype.cesiumColor = undefined;


/**
 * Clean up the drag circle interaction in Cesium.
 *
 * @this {os.interaction.DragCircle}
 */
plugin.cesium.interaction.dragcircle.cleanupWebGL = function() {
  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (os.MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    if (this.cesiumCircle) {
      scene.groundPrimitives.remove(this.cesiumCircle);
    }

    if (this.cesiumLabels) {
      scene.groundPrimitives.remove(this.cesiumLabels);
    }

    this.cesiumCircle = undefined;
    this.cesiumLabels = undefined;
    this.cesiumLabel = undefined;
  }
};


/**
 * Draw the circle in Cesium.
 *
 * @param {ol.Coordinate} start The start coordinate.
 * @param {ol.Coordinate} end The end coordinate.
 * @this {os.interaction.DragCircle}
 * @suppress {accessControls}
 */
plugin.cesium.interaction.dragcircle.updateWebGL = function(start, end) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    if (!this.cesiumColor) {
      this.cesiumColor = new Cesium.ColorGeometryInstanceAttribute(0, 1, 1, 1);
    }

    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
      os.MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    start = ol.proj.toLonLat(start, this.getMap().getView().getProjection());
    end = ol.proj.toLonLat(end, this.getMap().getView().getProjection());

    if (scene && start && end && this.distance) {
      if (!this.cesiumLabels) {
        this.cesiumLabels = new Cesium.LabelCollection({
          scene: scene
        });
        scene.groundPrimitives.add(this.cesiumLabels);
      }

      var center = Cesium.Cartesian3.fromDegrees(start[0], start[1]);
      var um = os.unit.UnitManager.getInstance();
      var labelText = um.formatToBestFit('distance', this.distance, 'm', um.getBaseSystem(), 3);

      if (!this.cesiumLabel) {
        this.cesiumLabel = this.cesiumLabels.add(/** @type {Cesium.optionsLabelCollection} */ ({
          position: center,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: false,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          font: os.style.label.getFont(),
          text: labelText
        }));
      }

      if (this.cesiumCircle) {
        scene.groundPrimitives.remove(this.cesiumCircle);
      }

      this.cesiumCircle = new Cesium.GroundPolylinePrimitive({
        asynchronous: false,
        appearance: new Cesium.PolylineColorAppearance(),
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.GroundPolylineGeometry({
            positions: plugin.cesium.generateCirclePositions(center, this.distance),
            arcType: os.interpolate.getMethod() === os.interpolate.Method.RHUMB ?
              Cesium.ArcType.RHUMB : Cesium.ArcType.GEODESIC,
            width: 2
          }),
          attributes: {
            color: this.cesiumColor
          }
        })
      });

      this.cesiumLabel.position = center;
      this.cesiumLabel.text = labelText;
      this.cesiumLabel.show = true;

      scene.groundPrimitives.add(this.cesiumCircle);
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};
