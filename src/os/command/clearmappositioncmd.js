goog.provide('os.command.ClearMapPosition');
goog.require('os.MapContainer');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Resets the map's center/zoom to the default values.
 * @implements {os.command.ICommand}
 * @constructor
 */
os.command.ClearMapPosition = function() {
  /**
   * @type {?osx.map.CameraState}
   * @private
   */
  this.cameraState_ = null;
};


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.title = 'Clear Map Position';


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.details = null;


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;
  var map = os.MapContainer.getInstance();
  this.cameraState_ = map.persistCameraState();
  map.resetView();
  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
os.command.ClearMapPosition.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.cameraState_) {
    var map = os.MapContainer.getInstance();
    map.restoreCameraState(this.cameraState_);
    this.state = os.command.State.READY;
    return true;
  }

  return false;
};
