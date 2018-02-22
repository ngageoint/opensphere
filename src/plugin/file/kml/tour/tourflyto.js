goog.provide('plugin.file.kml.tour.FlyTo');

goog.require('goog.Promise');
goog.require('ol.proj');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.file.kml.tour.Wait');


/**
 * Flies to the specified location on the map/globe.
 * @param {!osx.map.FlyToOptions} options Fly to options.
 * @extends {plugin.file.kml.tour.Wait}
 * @constructor
 */
plugin.file.kml.tour.FlyTo = function(options) {
  plugin.file.kml.tour.FlyTo.base(this, 'constructor', options.duration || plugin.file.kml.tour.FlyTo.DEFAULT_DURATION);

  // only 'smooth' and 'bounce' are allowed values, so if it isn't set to smooth force the default of bounce
  if (options.flightMode !== os.FlightMode.SMOOTH) {
    options.flightMode = os.FlightMode.BOUNCE;
  }

  /**
   * The fly to options.
   * @type {!osx.map.FlyToOptions}
   * @private
   */
  this.options_ = options;
};
goog.inherits(plugin.file.kml.tour.FlyTo, plugin.file.kml.tour.Wait);


/**
 * Default fly to duration.
 * @type {number}
 * @const
 */
plugin.file.kml.tour.FlyTo.DEFAULT_DURATION = 5000;


/**
 * @inheritDoc
 */
plugin.file.kml.tour.FlyTo.prototype.execute = function() {
  var duration = this.getInterval();
  if (duration > 0) {
    var options = /** @type {!osx.map.FlyToOptions} */ (os.object.unsafeClone(this.options_));
    options.duration = duration;

    // coordinates are expected to be in the map projection
    if (options.center) {
      options.center = ol.proj.transform(options.center, os.proj.EPSG4326, os.map.PROJECTION);
    }

    // fly to the specified position
    os.MapContainer.getInstance().flyTo(options);
  }

  // return the parent promise that will resolve after the duration has elapsed
  return plugin.file.kml.tour.FlyTo.base(this, 'execute');
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.FlyTo.prototype.pause = function() {
  if (this.isWaitActive()) {
    os.MapContainer.getInstance().cancelFlight();
  }

  plugin.file.kml.tour.FlyTo.base(this, 'pause');
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.FlyTo.prototype.reset = function() {
  if (this.isWaitActive()) {
    os.MapContainer.getInstance().cancelFlight();
  }

  plugin.file.kml.tour.FlyTo.base(this, 'reset');
};
