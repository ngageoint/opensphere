goog.module('os.command.ClearMapPosition');

const State = goog.require('os.command.State');
const {getMapContainer} = goog.require('os.map.instance');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Resets the map's center/zoom to the default values.
 *
 * @implements {ICommand}
 */
class ClearMapPosition {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Clear Map Position';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @type {?osx.map.CameraState}
     * @private
     */
    this.cameraState_ = null;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;
    var map = getMapContainer();
    this.cameraState_ = map.persistCameraState();
    map.resetView();
    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.cameraState_) {
      var map = getMapContainer();
      map.restoreCameraState(this.cameraState_);
      this.state = State.READY;
      return true;
    }

    return false;
  }
}

exports = ClearMapPosition;
