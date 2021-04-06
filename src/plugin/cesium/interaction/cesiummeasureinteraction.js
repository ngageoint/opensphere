goog.module('plugin.cesium.interaction.measure');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const DrawPolygon = goog.require('os.interaction.DrawPolygon');
const Measure = goog.require('os.interaction.Measure');
const drawpolygon = goog.require('plugin.cesium.interaction.drawpolygon');


/**
 * The Cesium labels.
 * @type {Cesium.LabelCollection|undefined}
 * @protected
 */
Measure.prototype.cesiumLabels = undefined;


/**
 * Clean up the draw polygon interaction in Cesium.
 *
 * @this {Measure}
 */
const cleanupWebGL = function() {
  drawpolygon.cleanupWebGL.call(this);

  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (MapContainer.getInstance().getWebGLRenderer());
  var scene = webgl ? webgl.getCesiumScene() : undefined;
  if (scene) {
    if (this.cesiumLabels) {
      scene.primitives.remove(this.cesiumLabels);
      this.cesiumLabels = null;
    }
  }
};

/**
 * Draw the measure line in Cesium.
 *
 * @this {Measure}
 * @suppress {accessControls}
 */
const updateWebGL = function() {
  drawpolygon.updateWebGL.call(this);

  if (MapContainer.getInstance().is3DEnabled()) {
    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
      MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    var lonlats = this.coords.map(DrawPolygon.coordToLonLat);

    if (scene && lonlats.length > 1) {
      var camera = MapContainer.getInstance().getWebGLCamera();

      if (!this.cesiumLabels) {
        this.cesiumLabels = new Cesium.LabelCollection();
        scene.primitives.add(this.cesiumLabels);
      }

      var label = null;

      if (this.cesiumLabels.length === this.distances_.length) {
        // modify the last one
        label = this.cesiumLabels.get(this.cesiumLabels.length - 1);
      } else {
        // add a new one
        label = this.cesiumLabels.add();
      }

      var i = this.distances_.length - 1;
      label.show = false;
      label.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, -(camera.getDistanceToCenter() / 5));
      label.font = os.style.label.getFont(Measure.LABEL_FONT_SIZE_);
      label.style = Cesium.LabelStyle.FILL_AND_OUTLINE;
      label.outlineWidth = 2;
      label.outlineColor = new Cesium.Color(0, 0, 0);
      label.pixelOffset = new Cesium.Cartesian2(4, 0);
      label.position = Cesium.Cartesian3.fromDegrees(lonlats[i][0], lonlats[i][1]);
      label.text = this.getDistanceText_(i);
      label.show = true;
    }
  }
};

exports = {
  cleanupWebGL,
  updateWebGL
};
