goog.module('plugin.file.kml.tour.FlyTo');
goog.module.declareLegacyNamespace();

const olProj = goog.require('ol.proj');
const MapContainer = goog.require('os.MapContainer');
const osMap = goog.require('os.map');
const FlightMode = goog.require('os.map.FlightMode');
const osObject = goog.require('os.object');
const osProj = goog.require('os.proj');
const Wait = goog.require('plugin.file.kml.tour.Wait');


/**
 * Flies to the specified location on the map/globe.
 */
class FlyTo extends Wait {
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
        options.center = olProj.transform(options.center, osProj.EPSG4326, osMap.PROJECTION);
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


exports = FlyTo;
