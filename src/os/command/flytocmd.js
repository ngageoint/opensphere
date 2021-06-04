goog.module('os.command.FlyTo');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const State = goog.require('os.command.State');
const {getMapContainer} = goog.require('os.map.instance');


/**
 * Command to fly the map.
 */
class FlyTo extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {osx.map.FlyToOptions=} opt_options The fly to options
   */
  constructor(opt_options) {
    super();
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
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    var mapContainer = getMapContainer();
    var view = mapContainer.getMap().getView();
    this.lastCenter_ = view.getCenter();

    var prevOptions = /** @type {!osx.map.FlyToOptions} */ ({
      center: view.getCenter()
    });

    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getWebGLCamera();
      if (camera) {
        prevOptions.altitude = camera.getAltitude();
      }
    } else {
      var resolution = view.getResolution();
      asserts.assert(resolution != null, 'resolution should be defined');

      prevOptions.zoom = mapContainer.resolutionToZoom(resolution);
    }

    this.prevOptions_ = prevOptions;

    // fly to the location
    mapContainer.flyTo(this.options_);

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.prevOptions_) {
      var mapContainer = getMapContainer();
      mapContainer.flyTo(this.prevOptions_);
    }

    return super.revert();
  }
}

exports = FlyTo;
