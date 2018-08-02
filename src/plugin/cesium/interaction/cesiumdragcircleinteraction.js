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
 * @this {os.interaction.DragCircle}
 */
plugin.cesium.interaction.dragcircle.cleanupWebGL = function() {
  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (os.MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    if (this.cesiumCircle) {
      scene.primitives.remove(this.cesiumCircle);
    }

    if (this.cesiumLabels) {
      scene.primitives.remove(this.cesiumLabels);
    }

    this.cesiumCircle = undefined;
    this.cesiumLabels = undefined;
    this.cesiumLabel = undefined;
  }
};


/**
 * Draw the circle in Cesium.
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
        this.cesiumLabels = new Cesium.LabelCollection();
        scene.primitives.add(this.cesiumLabels);
      }

      if (!this.cesiumLabel) {
        this.cesiumLabel = this.cesiumLabels.add();
        this.cesiumLabel.show = false;
        this.cesiumLabel.fillColor = Cesium.Color.YELLOW;
        this.cesiumLabel.scale = 0.6;
      }

      if (this.cesiumCircle) {
        scene.primitives.remove(this.cesiumCircle);
      }

      var center = Cesium.Cartesian3.fromDegrees(start[0], start[1]);
      var appearance = new Cesium.PolylineColorAppearance();
      this.cesiumCircle = new Cesium.Primitive({
        asynchronous: false,
        appearance: appearance,
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: plugin.cesium.generateCirclePositions(center, this.distance),
            vertexFormat: appearance.vertexFormat,
            width: 2
          }),
          attributes: {
            color: this.cesiumColor
          }
        })
      });

      var um = os.unit.UnitManager.getInstance();
      this.cesiumLabel.text = um.formatToBestFit('distance', this.distance, 'm', um.getBaseSystem(), 3);
      this.cesiumLabel.position = center;
      this.cesiumLabel.show = true;

      scene.primitives.add(this.cesiumCircle);
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};
