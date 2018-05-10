goog.provide('plugin.cesium.interaction.measure');

goog.require('os.interaction.DrawPolygon');
goog.require('os.interaction.Measure');
goog.require('plugin.cesium.interaction.drawpolygon');


/**
 * The Cesium labels.
 * @type {Cesium.LabelCollection|undefined}
 * @protected
 */
os.interaction.Measure.prototype.cesiumLabels = undefined;


/**
 * Clean up the draw polygon interaction in Cesium.
 * @this {os.interaction.Measure}
 */
plugin.cesium.interaction.measure.cleanupWebGL = function() {
  plugin.cesium.interaction.drawpolygon.cleanupWebGL.call(this);

  var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (os.MapContainer.getInstance().getWebGLRenderer());
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
 * @this {os.interaction.Measure}
 * @suppress {accessControls}
 */
plugin.cesium.interaction.measure.updateWebGL = function() {
  plugin.cesium.interaction.drawpolygon.updateWebGL.call(this);

  if (os.MapContainer.getInstance().is3DEnabled()) {
    var webgl = /** @type {plugin.cesium.CesiumRenderer|undefined} */ (
          os.MapContainer.getInstance().getWebGLRenderer());
    var scene = webgl ? webgl.getCesiumScene() : undefined;

    var lonlats = this.coords.map(os.interaction.DrawPolygon.coordToLonLat);

    if (scene && lonlats.length > 1) {
      var camera = os.MapContainer.getInstance().getWebGLCamera();

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
      label.font = os.style.label.getFont(os.interaction.Measure.LABEL_FONT_SIZE_);
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
