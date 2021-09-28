goog.declareModuleId('os.command.FlyTo');

import {getMapContainer} from '../map/mapinstance.js';
import AbstractSyncCommand from './abstractsynccommand.js';
import State from './state.js';

const asserts = goog.require('goog.asserts');


/**
 * Command to fly the map.
 */
export default class FlyTo extends AbstractSyncCommand {
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
