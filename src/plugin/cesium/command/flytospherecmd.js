goog.module('plugin.cesium.command.FlyToSphere');
goog.module.declareLegacyNamespace();

const mapContainer = goog.require('os.MapContainer');
const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');


/**
 * @suppress {accessControls}
 */
class FlyToSphere extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {!Cesium.BoundingSphere} sphere
   * @param {Cesium.optionsCameraFlyToBoundingSphere=} opt_options
   */
  constructor(sphere, opt_options) {
    super();
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
    this.oldPosition_ = mapContainer.getInstance().persistCameraState();

    var cam = /** @type {plugin.cesium.Camera} */ (mapContainer.getInstance().getWebGLCamera());
    var minRange = cam.calcDistanceForResolution(
        os.map.zoomToResolution(os.map.MAX_AUTO_ZOOM, os.map.PROJECTION), 0);

    sphere.radius = sphere.radius || 10;

    // gets the default offset
    var camera = /** @type {plugin.cesium.Camera} */ (mapContainer.getInstance().getWebGLCamera());
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
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  execute() {
    this.state = os.command.State.EXECUTING;

    this.sphere_.radius *= os.command.FlyToExtent.DEFAULT_BUFFER;

    var cam = /** @type {plugin.cesium.Camera} */ (mapContainer.getInstance().getWebGLCamera());
    cam.cam_.flyToBoundingSphere(this.sphere_, this.options_);

    this.sphere_.radius /= os.command.FlyToExtent.DEFAULT_BUFFER;

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = os.command.State.REVERTING;

    if (this.oldPosition_) {
      mapContainer.getInstance().restoreCameraState(this.oldPosition_);
    }

    return super.revert();
  }
}

exports = FlyToSphere;
