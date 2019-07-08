goog.provide('plugin.cesium.command.FlyToSphere');

goog.require('os.command.AbstractSyncCommand');


/**
 * @constructor
 * @param {!Cesium.BoundingSphere} sphere
 * @param {Cesium.optionsCameraFlyToBoundingSphere=} opt_options
 * @extends {os.command.AbstractSyncCommand}
 * @suppress {accessControls}
 */
plugin.cesium.command.FlyToSphere = function(sphere, opt_options) {
  plugin.cesium.command.FlyToSphere.base(this, 'constructor');
  this.title = 'Zoom to Bounding Sphere';

  /**
   * @type {!Cesium.BoundingSphere}
   * @private
   */
  this.sphere_ = sphere;

  /**
   * @type {osx.map.CameraState}
   * @private
   */
  this.oldPosition_ = os.map.mapContainer.persistCameraState();

  var cam = /** @type {plugin.cesium.Camera} */ (os.map.mapContainer.getWebGLCamera());
  var minRange = cam.calcDistanceForResolution(
      os.map.zoomToResolution(os.map.MAX_AUTO_ZOOM, os.map.PROJECTION), 0);

  sphere.radius = sphere.radius || 10;

  // gets the default offset
  var camera = /** @type {plugin.cesium.Camera} */ (os.map.mapContainer.getWebGLCamera());
  var offset = new Cesium.HeadingPitchRange(camera.cam_.heading, camera.cam_.pitch,
      os.command.FlyToExtent.DEFAULT_BUFFER * 2 * sphere.radius);

  offset.range = Math.max(offset.range, minRange);

  // the min range needs to include the furthest eye offset for the given sphere altitude
  // @see plugin.cesium.sync.VectorSynchronizer.updateLabelOffsets
  var distance = Cesium.Cartographic.fromCartesian(sphere.center).height + offset.range;
  offset.range += os.command.FlyToExtent.DEFAULT_BUFFER * distance / 10;

  /**
   * @type {Cesium.optionsCameraFlyToBoundingSphere}
   * @private
   */
  this.options_ = opt_options || /** @type {Cesium.optionsCameraFlyToBoundingSphere} */ ({
    offset: offset
  });
};
goog.inherits(plugin.cesium.command.FlyToSphere, os.command.AbstractSyncCommand);


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.cesium.command.FlyToSphere.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  this.sphere_.radius *= os.command.FlyToExtent.DEFAULT_BUFFER;

  var cam = /** @type {plugin.cesium.Camera} */ (os.map.mapContainer.getWebGLCamera());
  cam.cam_.flyToBoundingSphere(this.sphere_, this.options_);

  this.sphere_.radius /= os.command.FlyToExtent.DEFAULT_BUFFER;

  return this.finish();
};


/**
 * @inheritDoc
 */
plugin.cesium.command.FlyToSphere.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.oldPosition_) {
    os.map.mapContainer.restoreCameraState(this.oldPosition_);
  }

  return plugin.cesium.command.FlyToSphere.base(this, 'revert');
};

