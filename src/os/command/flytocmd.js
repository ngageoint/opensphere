goog.provide('os.command.FlyTo');

goog.require('goog.asserts');
goog.require('os.command.AbstractSyncCommand');
goog.require('os.command.State');



/**
 * Command to fly the map.
 *
 * @param {osx.map.FlyToOptions=} opt_options The fly to options
 * @extends {os.command.AbstractSyncCommand}
 * @constructor
 */
os.command.FlyTo = function(opt_options) {
  os.command.FlyTo.base(this, 'constructor');
  this.title = 'Fly To';

  /**
   * @type {!osx.map.FlyToOptions}
   * @private
   */
  this.options_ = opt_options || {};

  /**
   * @type {!osx.map.FlyToOptions}
   * @private
   */
  this.prevOptions_ = {};
};
goog.inherits(os.command.FlyTo, os.command.AbstractSyncCommand);


/**
 * @inheritDoc
 */
os.command.FlyTo.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var mapContainer = os.MapContainer.getInstance();
  var view = mapContainer.getMap().getView();
  this.lastCenter_ = view.getCenter();

  var prevOptions = /** @type {!osx.map.FlyToOptions} */ ({
    center: view.getCenter()
  });

  if (mapContainer.is3DEnabled()) {
    var camera = mapContainer.getCesiumCamera();
    if (camera) {
      prevOptions.altitude = camera.getAltitude();
    }
  } else {
    var resolution = view.getResolution();
    goog.asserts.assert(resolution != null, 'resolution should be defined');

    prevOptions.zoom = mapContainer.resolutionToZoom(resolution);
  }

  this.prevOptions_ = prevOptions;

  // fly to the location
  mapContainer.flyTo(this.options_);

  return this.finish();
};


/**
 * @inheritDoc
 */
os.command.FlyTo.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.prevOptions_) {
    var mapContainer = os.MapContainer.getInstance();
    mapContainer.flyTo(this.prevOptions_);
  }

  return os.command.FlyTo.base(this, 'revert');
};
