goog.declareModuleId('plugin.cesium.command.FlyToSphere');

const MapContainer = goog.require('os.MapContainer');
const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const FlyToExtent = goog.require('os.command.FlyToExtent');
const State = goog.require('os.command.State');
const osMap = goog.require('os.map');

const Camera = goog.requireType('plugin.cesium.Camera');


/**
 * @suppress {accessControls}
 */
export default class FlyToSphere extends AbstractSyncCommand {
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
    this.oldPosition_ = MapContainer.getInstance().persistCameraState();

    var cam = /** @type {Camera} */ (MapContainer.getInstance().getWebGLCamera());
    var minRange = cam.calcDistanceForResolution(
        osMap.zoomToResolution(osMap.MAX_AUTO_ZOOM, osMap.PROJECTION), 0);

    sphere.radius = sphere.radius || 10;

    // gets the default offset
    var camera = /** @type {Camera} */ (MapContainer.getInstance().getWebGLCamera());
    var offset = new Cesium.HeadingPitchRange(camera.cam_.heading, camera.cam_.pitch,
        FlyToExtent.DEFAULT_BUFFER * 2 * sphere.radius);

    offset.range = Math.max(offset.range, minRange);

    // the min range needs to include the furthest eye offset for the given sphere altitude
    // @see plugin.cesium.sync.VectorSynchronizer.updateLabelOffsets
    var distance = Cesium.Cartographic.fromCartesian(sphere.center).height + offset.range;
    offset.range += FlyToExtent.DEFAULT_BUFFER * distance / 10;

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
    this.state = State.EXECUTING;

    this.sphere_.radius *= FlyToExtent.DEFAULT_BUFFER;

    var cam = /** @type {Camera} */ (MapContainer.getInstance().getWebGLCamera());
    cam.cam_.flyToBoundingSphere(this.sphere_, this.options_);

    this.sphere_.radius /= FlyToExtent.DEFAULT_BUFFER;

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.oldPosition_) {
      MapContainer.getInstance().restoreCameraState(this.oldPosition_);
    }

    return super.revert();
  }
}
