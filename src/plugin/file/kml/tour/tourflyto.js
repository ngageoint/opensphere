goog.declareModuleId('plugin.file.kml.tour.FlyTo');

import {transform} from 'ol/src/proj.js';
import FlightMode from '../../../../os/map/flightmode.js';
import * as osMap from '../../../../os/map/map.js';
import MapContainer from '../../../../os/mapcontainer.js';
import * as osObject from '../../../../os/object/object.js';
import * as osProj from '../../../../os/proj/proj.js';
import Wait from './tourwait.js';


/**
 * Flies to the specified location on the map/globe.
 */
export default class FlyTo extends Wait {
  /**
   * Constructor.
   * @param {!osx.map.FlyToOptions} options Fly to options.
   */
  constructor(options) {
    super(options.duration || FlyTo.DEFAULT_DURATION);

    // only 'smooth' and 'bounce' are allowed values, so if it isn't set to smooth force the default of bounce
    if (options.flightMode !== FlightMode.SMOOTH) {
      options.flightMode = FlightMode.BOUNCE;
    }

    /**
     * The fly to options.
     * @type {!osx.map.FlyToOptions}
     * @private
     */
    this.options_ = options;
  }

  /**
   * @inheritDoc
   */
  execute() {
    var duration = this.getInterval();
    if (duration > 0) {
      var options = /** @type {!osx.map.FlyToOptions} */ (osObject.unsafeClone(this.options_));
      options.duration = duration;

      // coordinates are expected to be in the map projection
      if (options.center) {
        options.center = transform(options.center, osProj.EPSG4326, osMap.PROJECTION);
      }

      // fly to the specified position
      MapContainer.getInstance().flyTo(options);
    }

    // return the parent promise that will resolve after the duration has elapsed
    return super.execute();
  }

  /**
   * @inheritDoc
   */
  pause() {
    if (this.isWaitActive()) {
      MapContainer.getInstance().cancelFlight();
    }

    super.pause();
  }

  /**
   * @inheritDoc
   */
  reset() {
    if (this.isWaitActive()) {
      MapContainer.getInstance().cancelFlight();
    }

    super.reset();
  }
}


/**
 * Default fly to duration.
 * @type {number}
 * @const
 */
FlyTo.DEFAULT_DURATION = 5000;
